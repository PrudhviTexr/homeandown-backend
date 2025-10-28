# test_resend_send.py
import os
import sys
import pathlib
import asyncio
from dotenv import load_dotenv

# Ensure project root is on sys.path so `import app` works when running this script directly
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv('.env')
from app.services.email import send_email

async def main():
    to = os.getenv('TEST_EMAIL_TO') or os.getenv('GMAIL_USERNAME')
    if not to:
        print('No recipient configured. Set TEST_EMAIL_TO or GMAIL_USERNAME in .env')
        return
    res = await send_email(to, 'Resend API Test - Home & Own', '<p>This is a test email sent via Resend API</p>')
    print('send_email returned:', res)

if __name__ == '__main__':
    asyncio.run(main())
