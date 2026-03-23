# MongoDB Atlas Setup Guide (Real URL kaise banaye)

Agar aapko apne project mein real cloud database use karna hai, toh aap **MongoDB Atlas** ka use kar sakte hain. Niche diye gaye steps follow karein:

## Step 1: Account Banaye
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) par jayein.
2. Google se ya email se **Sign Up** karein.

## Step 2: Cluster Create Karein
1. Login karne ke baad, **"Build a Database"** par click karein.
2. **FREE** (Shared) option select karein.
3. Provider (AWS/Google/Azure) aur Region select karein (jo aapke paas ho, e.g., Mumbai).
4. **"Create Cluster"** par click karein. (Isme 1-3 minute lag sakte hain).

## Step 3: Database User Banaye
1. **Security** tab mein **Database Access** par click karein.
2. **"Add New Database User"** par click karein.
3. **Username** aur **Password** set karein (Password yaad rakhein, baad mein zarurat padegi).
4. Role mein "Read and write to any database" select karein.
5. **"Add User"** par click karein.

## Step 4: Network Access (IP Whitelist)
1. **Security** tab mein **Network Access** par click karein.
2. **"Add IP Address"** par click karein.
3. **"Allow Access from Anywhere"** (0.0.0.0/0) select karein (Development ke liye easy hai).
4. **Confirm** karein.

## Step 5: Connection String (URL) Le
1. Apne Cluster dashboard par wapas jayein.
2. **"Connect"** button par click karein.
3. **"Drivers"** option select karein (Node.js).
4. Aapko ek string dikaayi degi, jaise:
   ```
   mongodb+srv://prashant:<db_password>@cors.ypistdj.mongodb.net/?appName=CORS
   ```
5. Is url ko copy kar lein.

## Step 6: Project mein Add Karein
1. Apne project ke `backend/.env` file mein jayein.
2. `MONGODB_URI` ko update karein:
   ```env
   # Purana: mongodb://localhost:27017/corsguard
   MONGODB_URI=mongodb+srv://myuser:mypassword123@cluster0.abcd.mongodb.net/corsguard?retryWrites=true&w=majority
   ```
   *(Note: `<password>` ki jagah apna real password dalein jo Step 3 mein banaya tha. `<username>` ki jagah apna username.)*

3. Ab `npm run dev` ya `node server.js` chala kar check karein.
