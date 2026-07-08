const express = require('express');
const app = express();
const session = require('express-session');

// 미들 웨어
app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// 라우트
app.post("/login", (req, res) => {
    console.log("로그인 요청이 들어왔습니다.");
    console.log(req.body);

    if (req.body.id === "josh" &&
        req.body.password === "1234"
    ) {
        req.session.user = req.body.id;

        console.log(req.session);

        res.redirect("/dashboard");
    } else {
        res.send("로그인 실패");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// 대시보드 라우트
app.get("/dashboard", (req, res) => {         // dashboard.html 파일을 클라이언트에게 전송
    if (req.session.user) { 
        res.sendFile(__dirname + "/views/dashboard.html");
    } else {
        res.redirect("/");
    }
});

// 서버 시작
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});