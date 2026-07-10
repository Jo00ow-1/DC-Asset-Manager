const express = require('express');
const app = express();
const session = require('express-session');
const { Pool } = require("pg");
const pool = new Pool({
    user: "josh.jh",
    host: "localhost",
    database: "dc_asset_manager",
    password: "",
    port: 5432,
});

pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("데이터베이스 연결 실패:", err);
    } else {
        console.log("데이터베이스 연결 성공:", result.rows[0]);
    }
});
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
    const id = req.body.id.trim();
    const password = req.body.password.trim();

    console.log("로그인 요청이 들어왔습니다.");
    console.log(req.body);

    if (!id) {
        return res.send("아이디를 입력해주세요.");
    }
    if (!password) {
        return res.send("비밀번호를 입력해주세요.");
    }
    
    pool.query(
        "SELECT * FROM users WHERE username = $1",
        [id],        
        (err, result) => {
            if (err) {
                console.error(err);
                return res.send("로그인 실패");
            }

            const user = result.rows[0];

            if (!user) {
                return res.send("존재하지 않는 아이디입니다.");
            }

            if (user.password !== password) {
                return res.send("비밀번호가 일치하지 않습니다.");
            }
            
            req.session.user = user.username;
            
            console.log(req.session);

            res.redirect("/dashboard");
        }
    );
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

// 회원가입 라우트
app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/views/signup.html");
})
app.post("/signup", (req, res) => {
    const id = req.body.id.trim();
    const password = req.body.password.trim();
    const confirmpassword = req.body.confirmpassword.trim();

    console.log("회원가입 요청이 들어왔습니다.");
    console.log(req.body);

    if (!id) {
        return res.send("아이디를 입력해주세요.");
    }
    if (!password) {
        return res.send("비밀번호를 입력해주세요.");
    }
    if (!confirmpassword) {
        return res.send("비밀번호 확인을 입력해주세요.");
    }
    if (password !== confirmpassword) {
        return res.send("비밀번호가 일치하지 않습니다.");
        }
    pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        [id, password],
        (err, result) => {
            if (err) {
                console.error(err);
                
                if (err.code === "23505") {
                    return res.send("이미 존재하는 아이디입니다.");
                }
                
                return res.send("회원가입 실패");
            }
            res.send("회원가입 완료");
        }
    ); 
});
// 서버 시작
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});