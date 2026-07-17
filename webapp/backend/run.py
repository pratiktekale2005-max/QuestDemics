import uvicorn
import os
import sys
from dotenv import load_dotenv

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    load_dotenv()
    port = int(os.getenv("PORT", 8000))
    print("\n-----------------------------------------------------------")
    print(" Hunter! The System is awakening...")
    print(f" API Server listening at: http://localhost:{port}")
    print("-----------------------------------------------------------\n")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
