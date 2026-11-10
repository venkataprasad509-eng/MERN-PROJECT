# Online Course Marketplace 🎓

A full-stack web application where students can explore and purchase online courses, learn from course content, and track their learning progress. Instructors can manage courses, while administrators can manage the platform.

## 🚀 Features

- **User Authentication:** Register, log in, and manage user accounts.
- **Role-Based Access:** Separate experiences for students, instructors, and administrators.
- **Course Browsing:** Explore courses and view course details.
- **Shopping Cart:** Add courses to the cart and proceed to checkout.
- **Payments:** Payment integration using Razorpay.
- **Student Dashboard:** View enrolled courses and learning progress.
- **Instructor Dashboard:** Manage courses and instructor activities.
- **Wishlist:** Save courses for later.
- **Reviews and Ratings:** View and manage course feedback.
- **AI Integration:** AI-powered functionality using the Gemini API.

## 🛠️ Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML and CSS
- React Router
- React Hook Form
- Lucide React

### Backend
- Node.js
- Express.js
- REST APIs

### Authentication and Database
- Supabase Auth
- Supabase

### Other Tools and Services
- Git and GitHub
- Postman
- Razorpay
- Google Gemini API

## 📁 Project Structure

```text
course-market/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── data/
│   ├── package.json
│   └── .env.example
│
└── .gitignore
```

## ⚙️ Installation and Setup

### Prerequisites
- Node.js and npm
- A Supabase project
- API credentials for any integrations you enable

### 1. Clone the repository

```bash
git clone https://github.com/venkataprasad509-eng/course-market.git
cd course-market
```

### 2. Set up the frontend

```bash
cd client
npm install
```

Configure the frontend environment variables using `client/.env.example`. Create a local `.env` file and fill in the required values.

Start the frontend:

```bash
npm run dev
```

### 3. Set up the backend

Open a second terminal from the project root:

```bash
cd server
npm install
```

Configure the backend environment variables using `server/.env.example`. Create a local `.env` file and fill in the required values.

Start the backend using the script defined in `server/package.json`. For example, if the project defines a `dev` script:

```bash
npm run dev
```

Check the package scripts if the command differs.

## 🔐 Environment Variables

Keep API keys, passwords, and private credentials in local `.env` files. Never commit real secrets to GitHub.

Use the `.env.example` files as templates and fill in the required values for your own environment.

## 🧪 Testing

Use the application in your browser and test the frontend and backend APIs. Postman can be used to test supported API endpoints.

## 🔮 Future Improvements

- Deploy the frontend and backend.
- Expand course management and learning features.
- Improve automated testing and application security.
- Add further AI-powered learning assistance.

## 👨‍💻 Author

**Varaprasad G.**

GitHub: [@venkataprasad509-eng](https://github.com/venkataprasad509-eng)

## 📄 License

This project is currently a student project. A license can be added if and when one is selected.
