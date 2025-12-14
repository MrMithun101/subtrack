#!/usr/bin/env python3
"""
Quick test script to verify production configuration.
Run this to test database URL normalization and environment variable handling.
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

def test_database_url_normalization():
    """Test database URL normalization."""
    print("=" * 60)
    print("Testing Database URL Normalization")
    print("=" * 60)
    
    from app.db.config import get_database_url
    
    # Test cases
    test_cases = [
        (None, "sqlite:///./subtrack.db", "SQLite fallback"),
        ("postgres://user:pass@host:5432/db", "postgresql+psycopg2://user:pass@host:5432/db", "Railway postgres://"),
        ("postgresql://user:pass@host:5432/db", "postgresql+psycopg2://user:pass@host:5432/db", "postgresql:// without driver"),
        ("postgresql+psycopg2://user:pass@host:5432/db", "postgresql+psycopg2://user:pass@host:5432/db", "Already normalized"),
    ]
    
    for input_url, expected, description in test_cases:
        if input_url is None:
            # Temporarily unset DATABASE_URL
            if "DATABASE_URL" in os.environ:
                original = os.environ.pop("DATABASE_URL")
            else:
                original = None
        else:
            os.environ["DATABASE_URL"] = input_url
            original = input_url
        
        result = get_database_url()
        
        if input_url is None:
            if original:
                os.environ["DATABASE_URL"] = original
            else:
                os.environ.pop("DATABASE_URL", None)
        
        status = "✓" if result == expected else "✗"
        print(f"{status} {description}")
        print(f"   Input:    {input_url or 'None (env not set)'}")
        print(f"   Expected: {expected}")
        print(f"   Got:      {result}")
        if result != expected:
            print(f"   ERROR: Mismatch!")
        print()
    
    print()


def test_secret_key():
    """Test SECRET_KEY handling."""
    print("=" * 60)
    print("Testing SECRET_KEY Configuration")
    print("=" * 60)
    
    # Save original
    original_secret = os.environ.get("SECRET_KEY")
    
    # Test 1: No SECRET_KEY set (should warn)
    if "SECRET_KEY" in os.environ:
        del os.environ["SECRET_KEY"]
    
    print("Test 1: No SECRET_KEY set (should use dev secret with warning)")
    import warnings
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        from app.core.security import SECRET_KEY as key1
        print(f"   SECRET_KEY: {key1[:20]}...")
        if w:
            print(f"   Warning: {w[0].message}")
        print()
    
    # Test 2: SECRET_KEY set
    os.environ["SECRET_KEY"] = "test-production-secret-key-12345"
    # Reload module to get new value
    import importlib
    import app.core.security
    importlib.reload(app.core.security)
    key2 = app.core.security.SECRET_KEY
    print("Test 2: SECRET_KEY set")
    print(f"   SECRET_KEY: {key2}")
    if key2 == "test-production-secret-key-12345":
        print("   ✓ Correctly uses environment variable")
    else:
        print("   ✗ ERROR: Not using environment variable")
    print()
    
    # Restore original
    if original_secret:
        os.environ["SECRET_KEY"] = original_secret
    else:
        os.environ.pop("SECRET_KEY", None)
    
    print()


def test_cors_origins():
    """Test CORS origins configuration."""
    print("=" * 60)
    print("Testing CORS Origins Configuration")
    print("=" * 60)
    
    # Save originals
    original_cors = os.environ.get("CORS_ORIGINS")
    original_frontend = os.environ.get("FRONTEND_URL")
    
    # Test 1: No CORS_ORIGINS (should have localhost only)
    os.environ.pop("CORS_ORIGINS", None)
    os.environ.pop("FRONTEND_URL", None)
    
    # Import and check (we can't easily test the middleware, but we can test the logic)
    import os as os_module
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    cors_origins_env = os_module.getenv("CORS_ORIGINS")
    if cors_origins_env:
        production_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
        allowed_origins.extend(production_origins)
    
    frontend_url = os_module.getenv("FRONTEND_URL")
    if frontend_url and frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)
    
    print("Test 1: No CORS_ORIGINS set")
    print(f"   Allowed origins: {allowed_origins}")
    if len(allowed_origins) == 4 and all("localhost" in origin or "127.0.0.1" in origin for origin in allowed_origins):
        print("   ✓ Only localhost origins (correct for dev)")
    print()
    
    # Test 2: CORS_ORIGINS set (comma-separated)
    os.environ["CORS_ORIGINS"] = "https://app.vercel.app,https://www.subtrack.app"
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    cors_origins_env = os_module.getenv("CORS_ORIGINS")
    if cors_origins_env:
        production_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
        allowed_origins.extend(production_origins)
    
    print("Test 2: CORS_ORIGINS set (comma-separated)")
    print(f"   CORS_ORIGINS: {os.environ['CORS_ORIGINS']}")
    print(f"   Allowed origins: {allowed_origins}")
    if "https://app.vercel.app" in allowed_origins and "https://www.subtrack.app" in allowed_origins:
        print("   ✓ Production origins added correctly")
    print()
    
    # Restore originals
    if original_cors:
        os.environ["CORS_ORIGINS"] = original_cors
    else:
        os.environ.pop("CORS_ORIGINS", None)
    
    if original_frontend:
        os.environ["FRONTEND_URL"] = original_frontend
    else:
        os.environ.pop("FRONTEND_URL", None)
    
    print()


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("SubTrack Production Configuration Tests")
    print("=" * 60 + "\n")
    
    test_database_url_normalization()
    test_secret_key()
    test_cors_origins()
    
    print("=" * 60)
    print("Tests Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Set SECRET_KEY in production environment")
    print("2. Set CORS_ORIGINS with your Vercel domain(s)")
    print("3. Set DATABASE_URL (Railway provides this automatically)")
    print()


if __name__ == "__main__":
    main()

