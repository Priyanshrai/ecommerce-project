-- Create tables
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    orderDescription VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY,
    productName VARCHAR(100) NOT NULL,
    productDescription TEXT
);

CREATE TABLE IF NOT EXISTS "OrderProductMap" (
    id SERIAL PRIMARY KEY,
    orderId INT NOT NULL,
    productId INT NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Insert initial product data
INSERT INTO products (id, productName, productDescription) VALUES
    (1, 'HP laptop', 'This is HP laptop'),
    (2, 'lenovo laptop', 'This is lenovo'),
    (3, 'Car', 'This is Car'),
    (4, 'Bike', 'This is Bike')
ON CONFLICT (id) DO NOTHING; 