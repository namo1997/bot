# LINE OpenAI Chatbot

ระบบแชทบอท LINE ที่ใช้ OpenAI API ในการตอบคำถามผู้ใช้งาน

## การติดตั้ง

1. Clone โปรเจกต์:
```bash
git clone <your-repository-url>
cd <repository-name>
```

2. ติดตั้ง dependencies:
```bash
npm install
```

3. สร้างไฟล์ .env:
   - คัดลอกไฟล์ .env.example เป็น .env
   - กรอกค่า API keys และ tokens ที่จำเป็น:
     - LINE Channel Access Token
     - LINE Channel Secret
     - OpenAI API Key

4. เริ่มการทำงาน:
```bash
npm start
```

## การตั้งค่า LINE Bot

1. สร้าง LINE Bot ที่ [LINE Developers Console](https://developers.line.biz/console/)
2. ตั้งค่า Webhook URL ให้ชี้ไปที่ `https://your-domain.com/webhook`
3. เปิดใช้งาน webhook

## สภาพแวดล้อมที่จำเป็น

- Node.js v14 หรือใหม่กว่า
- npm หรือ yarn
- LINE Messaging API Channel
- OpenAI API Key

## การใช้งาน

- เพิ่ม LINE Bot เป็นเพื่อน
- ส่งข้อความไปที่บอท
- บอทจะตอบกลับโดยใช้ OpenAI API

## License

ISC
