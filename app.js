const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Berwashop'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'berwa-shop-secret',
    resave: false,
    saveUninitialized: true
}));

// Routes
app.get('/', (req, res) => {
    res.render('login', { error: req.session.error });
    req.session.error = null;
});

// Registration routes
app.get('/register', (req, res) => {
    res.render('register', { error: req.session.error });
    req.session.error = null;
});

app.post('/register', (req, res) => {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        req.session.error = "Passwords do not match";
        return res.redirect('/register');
    }

    const checkQuery = "SELECT * FROM Shopkeeper WHERE UserName = '" + username + "'";
    db.query(checkQuery, (err, results) => {
        if (err) {
            req.session.error = "An error occurred";
            return res.redirect('/register');
        }

        if (results.length > 0) {
            req.session.error = "Username already exists";
            return res.redirect('/register');
        }

        const insertQuery = "INSERT INTO Shopkeeper (UserName, Password) VALUES ('" + username + "', '" + password + "')";
        db.query(insertQuery, (err) => {
            if (err) {
                req.session.error = "Failed to create account";
                return res.redirect('/register');
            }

            req.session.error = "Registration successful! Please login.";
            res.redirect('/');
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM Shopkeeper WHERE UserName = '" + username + "' AND Password = '" + password + "'";
    
    db.query(query, (err, results) => {
        if (err) {
            req.session.error = "An error occurred";
            return res.redirect('/');
        }
        
        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.username = username;
            res.redirect('/dashboard');
        } else {
            req.session.error = "Invalid username or password";
            res.redirect('/');
        }
    });
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    
    db.query('SELECT * FROM Product ORDER BY ProductName', (err, products) => {
        if (err) {
            console.error('Error fetching products:', err);
            products = [];
        }
        res.render('dashboard', { products });
    });
});

// Products routes
app.get('/products', (req, res) => {
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    
    db.query('SELECT * FROM Product', (err, products) => {
        if (err) throw err;
        res.render('products', { products });
    });
});

app.post('/add-product', (req, res) => {
    const { productName } = req.body;
    db.query('INSERT INTO Product (ProductName) VALUES ("' + productName + '")', (err) => {
        if (err) throw err;
        res.redirect('/products');
    });
});

// Stock In routes
app.post('/stock-in', (req, res) => {
    const { productCode, quantity, uniquePrice } = req.body;
    const totalPrice = quantity * uniquePrice;
    const query = "INSERT INTO ProductIn (ProductCode, Date, Quantity, UniquePrice, TotalPrice) VALUES (" + productCode + ", CURDATE(), " + quantity + ", " + uniquePrice + ", " + totalPrice + ")";
    
    db.query(query, (err) => {
        if (err) throw err;
        res.redirect('/dashboard');
    });
});

// Stock Out routes
app.post('/stock-out', (req, res) => {
    const { productCode, quantity, uniquePrice } = req.body;
    const totalPrice = quantity * uniquePrice;
    const query = "INSERT INTO ProductOut (ProductCode, Date, Quantity, UniquePrice, TotalPrice) VALUES (" + productCode + ", CURDATE(), " + quantity + ", " + uniquePrice + ", " + totalPrice + ")";
    
    db.query(query, (err) => {
        if (err) throw err;
        res.redirect('/dashboard');
    });
});

// Reports route
app.get('/reports', (req, res) => {
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    
    const stockInQuery = `
        SELECT 
            Product.ProductName, 
            COALESCE(SUM(ProductIn.Quantity), 0) as TotalQuantity, 
            COALESCE(SUM(ProductIn.TotalPrice), 0) as TotalValue 
        FROM Product 
        LEFT JOIN ProductIn ON Product.ProductCode = ProductIn.ProductCode 
        GROUP BY Product.ProductCode, Product.ProductName
        ORDER BY Product.ProductName
    `;
    
    const stockOutQuery = `
        SELECT 
            Product.ProductName, 
            COALESCE(SUM(ProductOut.Quantity), 0) as TotalQuantity, 
            COALESCE(SUM(ProductOut.TotalPrice), 0) as TotalValue 
        FROM Product 
        LEFT JOIN ProductOut ON Product.ProductCode = ProductOut.ProductCode 
        GROUP BY Product.ProductCode, Product.ProductName
        ORDER BY Product.ProductName
    `;
    
    db.query(stockInQuery, (err, stockIn) => {
        if (err) {
            console.error('Error fetching stock in report:', err);
            stockIn = [];
        }
        db.query(stockOutQuery, (err, stockOut) => {
            if (err) {
                console.error('Error fetching stock out report:', err);
                stockOut = [];
            }
            res.render('reports', { stockIn, stockOut });
        });
    });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 