const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;

const UserRole = {
    ADMIN: 'admin',
    VIEWER: 'viewer',
    INPUT: 'input',
};

app.use(cors());
app.use(express.json());

// --- Ensure upload directory exists ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads directory at: ${uploadDir}`);
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));


// --- ROBUST MULTER SETUP for file uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const imageFileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|heic)$/i)) {
        // Create an error to send back to the user
        return cb(new Error('Hanya file gambar (.jpg, .jpeg, .png, .heic) yang diizinkan!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});


// --- MIDDLEWARE ---

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === UserRole.ADMIN) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
};

const requireAdminOrInput = (req, res, next) => {
    if (req.user && (req.user.role === UserRole.ADMIN || req.user.role === UserRole.INPUT)) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Admin or Input access required.' });
};

// Helper: Check if a non-admin user has access to a specific wallet
const checkWalletAccess = async (userId, walletId) => {
    const [permissions] = await pool.query(
        'SELECT walletId FROM user_wallet_permissions WHERE userId = ? AND walletId = ?',
        [userId, walletId]
    );
    return permissions.length > 0;
};

// Helper: Log an activity
const logActivity = async (action, entityId, details, userId, userName, walletId, walletName) => {
    const log = {
        id: uuidv4(),
        action,
        entityType: 'transaction',
        entityId,
        details,
        userId,
        userName,
        walletId,
        walletName,
        createdAt: new Date(),
    };
    await pool.query('INSERT INTO activity_logs SET ?', log);
    return log;
};

// --- AUTH ROUTER ---
const authRouter = express.Router();
app.use('/api/auth', authRouter);

authRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const userPayload = { id: user.id, username: user.username, role: user.role };
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1d' });

        // Fetch permissions for the frontend
        const [permissions] = await pool.query('SELECT walletId FROM user_wallet_permissions WHERE userId = ?', [user.id]);
        const userForFrontend = {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            username: user.username,
            role: user.role,
            accessibleWalletIds: permissions.map(p => p.walletId)
        };

        res.json({ token, user: userForFrontend });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to get current user's profile
authRouter.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, fullName, phone, username, role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        const [permissions] = await pool.query('SELECT walletId FROM user_wallet_permissions WHERE userId = ?', [user.id]);
        user.accessibleWalletIds = permissions.map(p => p.walletId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});


// --- API ROUTER SETUP (Authenticated routes) ---
const apiRouter = express.Router();
app.use('/api', authenticateToken, apiRouter);


// --- API ENDPOINTS ---

// Upload endpoint with robust error handling
apiRouter.post('/upload', requireAdminOrInput, (req, res) => {
    const uploader = upload.single('invoice');

    uploader(req, res, function (err) {
        console.log('Processing upload for file:', req.file);

        if (err instanceof multer.MulterError) {
            // A Multer error occurred (e.g., file too large).
            console.error('Multer Error:', err.message);
            return res.status(400).json({ message: `Gagal mengunggah: ${err.message}` });
        } else if (err) {
            // An unknown error occurred (e.g., our custom file filter error).
            console.error('Unknown Upload Error:', err.message);
            return res.status(400).json({ message: err.message });
        }

        // Check if a file was actually uploaded.
        if (!req.file) {
            console.error('Upload Error: No file was received by the server.');
            return res.status(400).json({ message: 'Tidak ada file yang diunggah. Pastikan file yang dipilih adalah gambar.' });
        }

        // Everything went fine.
        console.log('File uploaded successfully:', req.file.filename);
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
    });
});

// GET /users
apiRouter.get('/users', requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, fullName, phone, username, role FROM users');
        const [permissions] = await pool.query('SELECT userId, walletId FROM user_wallet_permissions');
        const permissionsMap = permissions.reduce((acc, p) => {
            if (!acc[p.userId]) acc[p.userId] = [];
            acc[p.userId].push(p.walletId);
            return acc;
        }, {});
        const usersWithPermissions = users.map(user => ({
            ...user,
            accessibleWalletIds: permissionsMap[user.id] || []
        }));
        res.json(usersWithPermissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// GET /wallets (with access control)
apiRouter.get('/wallets', async (req, res) => {
    try {
        if (req.user.role === UserRole.ADMIN) {
            const [wallets] = await pool.query('SELECT * FROM wallets ORDER BY name');
            return res.json(wallets);
        }
        const [permissions] = await pool.query('SELECT walletId FROM user_wallet_permissions WHERE userId = ?', [req.user.id]);
        if (permissions.length === 0) return res.json([]);
        const accessibleWalletIds = permissions.map(p => p.walletId);
        const [wallets] = await pool.query('SELECT * FROM wallets WHERE id IN (?) ORDER BY name', [accessibleWalletIds]);
        res.json(wallets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wallets' });
    }
});

// GET /transactions (with access control)
apiRouter.get('/transactions', async (req, res) => {
    try {
        let transactions;
        if (req.user.role === UserRole.ADMIN) {
            [transactions] = await pool.query('SELECT * FROM transactions ORDER BY date DESC, id DESC');
        } else {
            const [permissions] = await pool.query('SELECT walletId FROM user_wallet_permissions WHERE userId = ?', [req.user.id]);
            if (permissions.length === 0) return res.json([]);
            const accessibleWalletIds = permissions.map(p => p.walletId);
            [transactions] = await pool.query('SELECT * FROM transactions WHERE walletId IN (?) ORDER BY date DESC, id DESC', [accessibleWalletIds]);
        }
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// GET /categories
apiRouter.get('/categories', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// GET /budgets (with access control)
apiRouter.get('/budgets', async (req, res) => {
    try {
        let budgets;
        if (req.user.role === UserRole.ADMIN) {
            [budgets] = await pool.query('SELECT * FROM budgets');
        } else {
            const [permissions] = await pool.query('SELECT walletId FROM user_wallet_permissions WHERE userId = ?', [req.user.id]);
            if (permissions.length === 0) return res.json([]);
            const accessibleWalletIds = permissions.map(p => p.walletId);
            [budgets] = await pool.query('SELECT * FROM budgets WHERE walletId IN (?)', [accessibleWalletIds]);
        }
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching budgets' });
    }
});

// GET /activity-logs (with access control, all roles can access)
apiRouter.get('/activity-logs', async (req, res) => {
    try {
        let logs;
        if (req.user.role === UserRole.ADMIN) {
            [logs] = await pool.query('SELECT * FROM activity_logs ORDER BY createdAt DESC LIMIT 200');
        } else {
            const [permissions] = await pool.query('SELECT walletId FROM user_wallet_permissions WHERE userId = ?', [req.user.id]);
            if (permissions.length === 0) return res.json([]);
            const accessibleWalletIds = permissions.map(p => p.walletId);
            [logs] = await pool.query('SELECT * FROM activity_logs WHERE walletId IN (?) ORDER BY createdAt DESC LIMIT 200', [accessibleWalletIds]);
        }
        res.json(logs);
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({ message: 'Error fetching activity logs' });
    }
});

// POST /transactions (Admin & Input, with wallet access check for Input)
apiRouter.post('/transactions', requireAdminOrInput, async (req, res) => {
    const { amount, type, categoryId, walletId, description, date, invoiceUrl } = req.body;
    if (!amount || !type || !categoryId || !walletId || !date) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Wallet access check for Input role
    if (req.user.role === UserRole.INPUT) {
        const hasAccess = await checkWalletAccess(req.user.id, walletId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke dompet ini.' });
        }
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const balanceChange = type === 'income' ? amount : -amount;
        await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [balanceChange, walletId]);
        const newTransactionId = uuidv4();
        const newTransaction = { id: newTransactionId, date, amount, type, categoryId, walletId, description, invoiceUrl };
        await connection.query('INSERT INTO transactions SET ?', newTransaction);
        await connection.commit();
        const [[updatedWallet]] = await connection.query('SELECT * FROM wallets WHERE id = ?', [walletId]);

        // Log activity
        const [[user]] = await pool.query('SELECT fullName FROM users WHERE id = ?', [req.user.id]);
        const categoryName = (await pool.query('SELECT name FROM categories WHERE id = ?', [categoryId]))[0][0]?.name || '';
        const formatAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
        await logActivity(
            'add', newTransactionId,
            `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${formatAmount} - ${categoryName}${description ? ': ' + description : ''}`,
            req.user.id, user.fullName, walletId, updatedWallet.name
        );

        res.status(201).json({ updatedTransaction: newTransaction, updatedWallets: [updatedWallet] });
    } catch (error) {
        await connection.rollback();
        console.error("Add Transaction Error:", error);
        res.status(500).json({ message: 'Failed to add transaction' });
    } finally {
        connection.release();
    }
});

// PUT /transactions/:id (Admin & Input, with wallet access check)
apiRouter.put('/transactions/:id', requireAdminOrInput, async (req, res) => {
    const { id } = req.params;
    const { amount, type, categoryId, walletId, description, date, invoiceUrl } = req.body;

    if (!amount || !type || !categoryId || !walletId || !date) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Wallet access check for Input role
    if (req.user.role === UserRole.INPUT) {
        const hasAccess = await checkWalletAccess(req.user.id, walletId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke dompet ini.' });
        }
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get the original transaction
        const [[oldTransaction]] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!oldTransaction) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // For Input role, also check access to the old wallet
        if (req.user.role === UserRole.INPUT && oldTransaction.walletId !== walletId) {
            const hasOldAccess = await checkWalletAccess(req.user.id, oldTransaction.walletId);
            if (!hasOldAccess) {
                await connection.rollback();
                return res.status(403).json({ message: 'Anda tidak memiliki akses ke dompet asal transaksi.' });
            }
        }

        // 2. Revert the old transaction's impact on its original wallet
        const oldBalanceChange = oldTransaction.type === 'income' ? -oldTransaction.amount : +oldTransaction.amount;
        await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [oldBalanceChange, oldTransaction.walletId]);

        // 3. Apply the new transaction's impact on its new wallet
        const newBalanceChange = type === 'income' ? +amount : -amount;
        await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [newBalanceChange, walletId]);

        // 4. Update the transaction record itself
        const updatedTransactionData = { date, amount, type, categoryId, walletId, description, invoiceUrl };
        await connection.query('UPDATE transactions SET ? WHERE id = ?', [updatedTransactionData, id]);

        await connection.commit();

        // 5. Fetch the final state of all affected wallets to return to the client
        const affectedWalletIds = [oldTransaction.walletId, walletId];
        const uniqueAffectedWalletIds = [...new Set(affectedWalletIds)];
        const [updatedWallets] = await connection.query('SELECT * FROM wallets WHERE id IN (?)', [uniqueAffectedWalletIds]);

        // Log activity
        const [[user]] = await pool.query('SELECT fullName FROM users WHERE id = ?', [req.user.id]);
        const categoryName = (await pool.query('SELECT name FROM categories WHERE id = ?', [categoryId]))[0][0]?.name || '';
        const walletName = updatedWallets.find(w => w.id === walletId)?.name || '';
        const formatAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
        await logActivity(
            'edit', id,
            `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${formatAmount} - ${categoryName}${description ? ': ' + description : ''}`,
            req.user.id, user.fullName, walletId, walletName
        );

        res.status(200).json({ updatedTransaction: { id, ...updatedTransactionData }, updatedWallets });

    } catch (error) {
        await connection.rollback();
        console.error("Update Transaction Error:", error);
        res.status(500).json({ message: 'Failed to update transaction' });
    } finally {
        connection.release();
    }
});

// DELETE /transactions/:id (Admin & Input, with wallet access check)
apiRouter.delete('/transactions/:id', requireAdminOrInput, async (req, res) => {
    const { id } = req.params;

    const connection = await pool.getConnection();
    try {
        const [[transaction]] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Wallet access check for Input role
        if (req.user.role === UserRole.INPUT) {
            const hasAccess = await checkWalletAccess(req.user.id, transaction.walletId);
            if (!hasAccess) {
                return res.status(403).json({ message: 'Anda tidak memiliki akses ke dompet ini.' });
            }
        }

        await connection.beginTransaction();

        // Revert the transaction's impact on its wallet
        const balanceRevert = transaction.type === 'income' ? -transaction.amount : +transaction.amount;
        await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [balanceRevert, transaction.walletId]);

        // Delete the transaction
        await connection.query('DELETE FROM transactions WHERE id = ?', [id]);

        await connection.commit();

        const [[updatedWallet]] = await connection.query('SELECT * FROM wallets WHERE id = ?', [transaction.walletId]);

        // Log activity
        const [[user]] = await pool.query('SELECT fullName FROM users WHERE id = ?', [req.user.id]);
        const categoryName = (await pool.query('SELECT name FROM categories WHERE id = ?', [transaction.categoryId]))[0][0]?.name || '';
        const formatAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(transaction.amount);
        await logActivity(
            'delete', id,
            `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${formatAmount} - ${categoryName}${transaction.description ? ': ' + transaction.description : ''}`,
            req.user.id, user.fullName, transaction.walletId, updatedWallet.name
        );

        res.status(200).json({ deletedTransactionId: id, updatedWallets: [updatedWallet] });
    } catch (error) {
        await connection.rollback();
        console.error("Delete Transaction Error:", error);
        res.status(500).json({ message: 'Failed to delete transaction' });
    } finally {
        connection.release();
    }
});


// PUT /users/:id/permissions
apiRouter.put('/users/:id/permissions', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { accessibleWalletIds } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM user_wallet_permissions WHERE userId = ?', [id]);
        if (accessibleWalletIds && accessibleWalletIds.length > 0) {
            const values = accessibleWalletIds.map(walletId => [id, walletId]);
            await connection.query('INSERT INTO user_wallet_permissions (userId, walletId) VALUES ?', [values]);
        }
        await connection.commit();
        const [[updatedUser]] = await pool.query('SELECT id, fullName, phone, username, role FROM users WHERE id = ?', [id]);
        const [permissions] = await pool.query('SELECT walletId FROM user_wallet_permissions WHERE userId = ?', [id]);
        updatedUser.accessibleWalletIds = permissions.map(p => p.walletId);
        res.json(updatedUser);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Failed to update permissions' });
    } finally {
        connection.release();
    }
});

// --- ADMIN CRUD ---
// Wallets
apiRouter.post('/wallets', requireAdmin, async (req, res) => {
    const { name } = req.body;
    const newWallet = { id: uuidv4(), name, balance: 0 };
    await pool.query('INSERT INTO wallets SET ?', newWallet);
    res.status(201).json(newWallet);
});
apiRouter.put('/wallets/:id', requireAdmin, async (req, res) => {
    const { name } = req.body;
    await pool.query('UPDATE wallets SET name = ? WHERE id = ?', [name, req.params.id]);
    const [[updatedWallet]] = await pool.query('SELECT * FROM wallets WHERE id = ?', [req.params.id]);
    res.json(updatedWallet);
});
apiRouter.delete('/wallets/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        const [transactions] = await connection.query('SELECT id FROM transactions WHERE walletId = ? LIMIT 1', [id]);
        if (transactions.length > 0) {
            return res.status(400).json({ message: 'Tidak dapat menghapus dompet karena masih memiliki transaksi terkait.' });
        }
        await connection.beginTransaction();
        await connection.query('DELETE FROM user_wallet_permissions WHERE walletId = ?', [id]);
        await connection.query('DELETE FROM budgets WHERE walletId = ?', [id]); // Also delete related budgets
        await connection.query('DELETE FROM wallets WHERE id = ?', [id]);
        await connection.commit();
        res.status(204).send();
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal menghapus dompet karena kesalahan server.' });
    } finally {
        connection.release();
    }
});

// Categories
apiRouter.post('/categories', requireAdmin, async (req, res) => {
    const { name, type, parentId } = req.body;
    const newCategory = { id: uuidv4(), name, type, parentId: parentId || null };
    await pool.query('INSERT INTO categories SET ?', newCategory);
    res.status(201).json(newCategory);
});
apiRouter.put('/categories/:id', requireAdmin, async (req, res) => {
    const { name } = req.body;
    await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
    const [[updatedCategory]] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json(updatedCategory);
});
apiRouter.delete('/categories/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [transactions] = await pool.query('SELECT id FROM transactions WHERE categoryId = ? LIMIT 1', [id]);
        if (transactions.length > 0) {
            return res.status(400).json({ message: 'Kategori ini digunakan oleh transaksi.' });
        }
        const [budgets] = await pool.query('SELECT categoryId FROM budgets WHERE categoryId = ? LIMIT 1', [id]);
        if (budgets.length > 0) {
            return res.status(400).json({ message: 'Kategori ini digunakan oleh anggaran.' });
        }
        const [subCategories] = await pool.query('SELECT id FROM categories WHERE parentId = ? LIMIT 1', [id]);
        if (subCategories.length > 0) {
            return res.status(400).json({ message: 'Tidak dapat menghapus kategori karena memiliki sub-kategori.' });
        }
        await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus kategori.' });
    }
});

// Users
apiRouter.post('/users', requireAdmin, async (req, res) => {
    const { fullName, username, phone, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), fullName, username, phone, role, password: hashedPassword };
    await pool.query('INSERT INTO users SET ?', newUser);
    const { password: _, ...userToReturn } = newUser;
    res.status(201).json(userToReturn);
});
apiRouter.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { fullName, phone, username, role, password } = req.body;
    const loggedInUser = req.user;
    if (loggedInUser.role !== UserRole.ADMIN && loggedInUser.id !== id) {
        return res.status(403).json({ message: "Forbidden: You can only edit your own profile." });
    }
    try {
        let query = 'UPDATE users SET fullName = ?, phone = ?, username = ?';
        const params = [fullName, phone, username];
        if (role && loggedInUser.role === UserRole.ADMIN) {
            query += ', role = ?';
            params.push(role);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        query += ' WHERE id = ?';
        params.push(id);
        await pool.query(query, params);
        const [[user]] = await pool.query('SELECT id, fullName, phone, username, role FROM users WHERE id = ?', [id]);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user profile.' });
    }
});
apiRouter.delete('/users/:id', requireAdmin, async (req, res) => {
    if (req.user.id === req.params.id) {
        return res.status(400).json({ message: "Cannot delete your own account." });
    }
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Budgets
apiRouter.post('/budgets', requireAdmin, async (req, res) => {
    const { walletId, categoryId, amount } = req.body;
    await pool.query('INSERT INTO budgets (walletId, categoryId, amount) VALUES (?, ?, ?)', [walletId, categoryId, amount]);
    res.status(201).json({ walletId, categoryId, amount });
});
apiRouter.put('/budgets', requireAdmin, async (req, res) => {
    const { walletId, categoryId, amount } = req.body;
    await pool.query('UPDATE budgets SET amount = ? WHERE categoryId = ? AND walletId = ?', [amount, categoryId, walletId]);
    res.json({ walletId, categoryId, amount });
});
apiRouter.delete('/budgets', requireAdmin, async (req, res) => {
    const { walletId, categoryId } = req.body;
    await pool.query('DELETE FROM budgets WHERE categoryId = ? AND walletId = ?', [categoryId, walletId]);
    res.status(204).send();
});

// --- SERVE FRONTEND ---
const buildPath = path.join(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
        if (!req.originalUrl.startsWith('/api/')) {
            res.sendFile(path.join(buildPath, 'index.html'));
        } else {
            res.status(404).json({ message: 'API endpoint not found' });
        }
    });
} else {
    app.get('/', (req, res) => {
        res.send('Backend server is running in development mode. Frontend is served by Vite dev server.');
    });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`Serving frontend from ${buildPath}`);
    }
});