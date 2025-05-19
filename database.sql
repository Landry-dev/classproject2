CREATE DATABASE IF NOT EXISTS Berwashop;
USE Berwashop;

CREATE TABLE Shopkeeper (
    ShopkeeperId INT AUTO_INCREMENT PRIMARY KEY,
    UserName VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(100) NOT NULL
);

CREATE TABLE Product (
    ProductCode INT AUTO_INCREMENT PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL
);

CREATE TABLE ProductIn (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ProductCode INT,
    Date DATE,
    Quantity INT,
    UniquePrice DECIMAL(10,2),
    TotalPrice DECIMAL(10,2),
    FOREIGN KEY (ProductCode) REFERENCES Product(ProductCode)
);

CREATE TABLE ProductOut (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ProductCode INT,
    Date DATE,
    Quantity INT,
    UniquePrice DECIMAL(10,2),
    TotalPrice DECIMAL(10,2),
    FOREIGN KEY (ProductCode) REFERENCES Product(ProductCode)
); 