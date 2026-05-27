-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stored as a hashed password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROFILES TABLE (1-to-1 relationship with Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age INT CHECK (age > 0),
    gender VARCHAR(20),
    medical_history TEXT, -- General pre-existing conditions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SYMPTOMS TABLE (1-to-many relationship with Users)
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    input_type VARCHAR(20) DEFAULT 'text', -- Can be 'text' or 'voice'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ASSESSMENTS TABLE (1-to-1 relationship with Symptoms)
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symptom_id UUID NOT NULL UNIQUE REFERENCES symptoms(id) ON DELETE CASCADE,
    predicted_condition VARCHAR(255),
    risk_level VARCHAR(50) CHECK (risk_level IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. RECOMMENDATIONS TABLE (1-to-1 relationship with Assessments)
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
    advice TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. HISTORY TABLE (General Chat/Interaction Log)
-- Tracks the ongoing conversation between the user and the Doctor AI bot
CREATE TABLE history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(50) CHECK (sender IN ('user', 'ai')),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SAMPLE DATA (Seed Script)
-- =========================================================

-- Insert Sample User
INSERT INTO users (id, name, email, password) 
VALUES ('11111111-1111-1111-1111-111111111111', 'John Doe', 'john.doe@example.com', '$2b$10$SampleHashedPasswordString');

-- Insert Sample Profile
INSERT INTO profiles (user_id, age, gender, medical_history) 
VALUES ('11111111-1111-1111-1111-111111111111', 35, 'Male', 'Asthma in childhood');

-- Insert Sample Symptom (User reports a symptom)
INSERT INTO symptoms (id, user_id, description, input_type) 
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'I have a severe headache and have been feeling nauseous since morning.', 'text');

-- Insert Sample Assessment (AI output for the symptom)
INSERT INTO assessments (id, symptom_id, predicted_condition, risk_level) 
VALUES ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Migraine / Dehydration', 'Medium');

-- Insert Sample Recommendation (AI advice)
INSERT INTO recommendations (assessment_id, advice) 
VALUES ('33333333-3333-3333-3333-333333333333', 'Please drink plenty of water and rest in a dark, quiet room. If the headache persists for more than 24 hours or worsens rapidly, consult a doctor immediately. Note: This is an AI assessment and not medical advice.');

-- Insert Chat History Log
INSERT INTO history (user_id, sender, message) VALUES 
('11111111-1111-1111-1111-111111111111', 'user', 'I have a severe headache and have been feeling nauseous since morning.'),
('11111111-1111-1111-1111-111111111111', 'ai', 'Based on your symptoms, this could be a migraine or dehydration. Risk Level: Medium. Please drink plenty of water and rest in a dark, quiet room. If the headache persists, consult a doctor immediately.');
