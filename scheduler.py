import os
import sys
import time
import json
import asyncio
import threading
from datetime import datetime

_last_eod_day = None
_is_syncing = False

def run_sync_task(base_dir=None):
    global _is_syncing
    if _is_syncing:
        return {"status": "busy", "message": "Tiến trình đồng bộ đang chạy."}
    _is_syncing = True
    try:
        if base_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        from calc_sector_flow_history import main as sync_main
        asyncio.run(sync_main())
        
        status_file = os.path.join(base_dir, 'cache', 'sync_status.json')
        os.makedirs(os.path.dirname(status_file), exist_ok=True)
        with open(status_file, 'w', encoding='utf-8') as f:
            json.dump({
                "last_sync": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "status": "success",
                "auto_scheduler": "Active (15:30 Mon-Fri)"
            }, f, ensure_ascii=False)
            
        return {"status": "success", "message": "Đồng bộ dữ liệu ngành thành công!"}
    except Exception as e:
        print(f"[Scheduler] Sync error: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        _is_syncing = False

def run_eod_scheduler(base_dir=None):
    global _last_eod_day
    print("[EOD Scheduler] Initialized. Daily sync scheduled for 15:30 (Mon-Fri) after market close.")
    while True:
        try:
            now = datetime.now()
            today_str = now.strftime('%Y-%m-%d')
            # Check Mon-Fri and time >= 15:30
            if now.weekday() < 5 and (now.hour > 15 or (now.hour == 15 and now.minute >= 30)):
                if _last_eod_day != today_str:
                    print(f"[EOD Scheduler] Triggering automatic EOD sync for {today_str} at {now.strftime('%H:%M:%S')}...")
                    res = run_sync_task(base_dir)
                    _last_eod_day = today_str
                    print(f"[EOD Scheduler] Automatic EOD sync completed: {res}")
            time.sleep(30)
        except Exception as e:
            print(f"[EOD Scheduler] Error in loop: {e}")
            time.sleep(30)

def start_scheduler_in_background(base_dir=None):
    t = threading.Thread(target=run_eod_scheduler, args=(base_dir,), daemon=True)
    t.start()
    return t

if __name__ == '__main__':
    print("Testing sync task...")
    print(run_sync_task())
