import subprocess
import sys
import time
import webbrowser
import os

def main():
    print("====================================")
    print(" Starting Ashtadisha Unified Server ")
    print("====================================")
    
    # 1. Start FastApi Backend Process
    backend_dir = os.path.join(os.path.dirname(__file__), "python_backend")
    
    print("[1/2] Starting Python Backend Server (Port 5000)...")
    backend_process = subprocess.Popen(
        [sys.executable, "backend.py"], 
        cwd=backend_dir
    )
    
    # Give the backend a second to initialize
    time.sleep(1.5)
    
    # 2. Start Frontend Static HTML Server
    print("[2/2] Starting Frontend Web Server (Port 8000)...")
    frontend_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8000"]
    )
    
    # Wait a moment, then automatically open the browser
    time.sleep(1.5)
    print("\n[SUCCESS] All systems go! Opening website...")
    webbrowser.open("http://localhost:8000")
    
    print("\n[NOTE] Keep this terminal open while you work.")
    print("Press CTRL+C in this terminal to safely stop BOTH servers at once.")
    
    # Wait until user terminates (Ctrl+C)
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n\nShutting down both servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Goodbye!")

if __name__ == "__main__":
    main()
