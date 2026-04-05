process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-unit-tests-min-32-chars";
process.env.SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || "postgres://user:pass@127.0.0.1:5432/testdb";
process.env.NODE_ENV = "test";
