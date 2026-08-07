"""Compatibility entry point for older start commands.

Use either:
    python -m uvicorn main:app --reload
or:
    python -m uvicorn sales_agent:app --reload
"""

try:
    from .main import app
except ImportError:
    from main import app
