BEGIN;

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL,
	username TEXT NOT NULL,
	email TEXT NOT NULL,
	password TEXT NOT NULL
);

CREATE TABLE properties (
	id SERIAL PRIMARY KEY,
	user_id INTEGER REFERENCES users ON DELETE CASCADE NOT NULL,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL,
    slug VARCHAR(255) NOT NULL,
	image_src TEXT,
	address VARCHAR(255) NOT NULL,
	city VARCHAR(255),
	state VARCHAR(255),
	zip VARCHAR(255),
	description TEXT,
	price INTEGER,
	year_built VARCHAR(255),
	roof_type VARCHAR(255),
	foundation_type VARCHAR(255),
	exterior_material VARCHAR(255),
	basement VARCHAR(255),
	notes TEXT,
	floor_size INTEGER,
	lot_size DECIMAL,
	bedrooms INTEGER,
	bathrooms DECIMAL,
	stories INTEGER
);

CREATE TABLE improvements (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL,
	property_id INTEGER REFERENCES properties ON DELETE CASCADE NOT NULL,
	name TEXT NOT NULL,
	cost INTEGER NOT NULL
);

COMMIT;