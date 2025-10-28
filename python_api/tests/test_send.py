# test_send.py
import os, asyncio, ssl
from dotenv import load_dotenv
load_dotenv(".env")
from aiosmtplib import send
from email.message import EmailMessage
import certifi

async def test():
    user = os.getenv("GMAIL_USERNAME")
    pw = os.getenv("GMAIL_APP_PASSWORD")
    if not user or not pw:
        print("Missing GMAIL_USERNAME or GMAIL_APP_PASSWORD")
        return
    msg = EmailMessage()
    msg["From"] = f"Home & Own <{user}>"
    msg["To"] = user
    msg["Subject"] = "Home & Own SMTP test"
    msg.set_content("SMTP test (plain)")
    msg.add_alternative("<p>SMTP test from server</p>", subtype="html")
    try:
        tls_ctx = ssl.create_default_context(cafile=certifi.where())
        r = await send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=user,
            password=pw,
            timeout=30,
            tls_context=tls_ctx,
        )
        print("SMTP send result:", r)
    except Exception as e:
        print("SMTP send failed:", repr(e))

if __name__ == "__main__":
    asyncio.run(test())