-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bikes Table
CREATE TABLE bikes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    image VARCHAR(255),
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Race Results Table
CREATE TABLE race_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    score INTEGER NOT NULL,
    race_time DECIMAL(5,2),
    bike_id INTEGER REFERENCES bikes(id),
    customization JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards Table
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    score_requirement INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Reward Claims (Vouchers) Table
CREATE TABLE reward_claims (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reward_id INTEGER REFERENCES rewards(id),
    voucher_code VARCHAR(50) UNIQUE NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    redeemed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ISSUED' -- 'ISSUED', 'REDEEMED', 'EXPIRED'
);