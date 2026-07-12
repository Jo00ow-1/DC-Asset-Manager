require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const { Pool } = require("pg");
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
const bcrypt = require('bcrypt');



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

// 로그인 라우트
app.post("/login", async (req, res) => {
    const id = req.body.id?.trim();
    const password = req.body.password?.trim();

    console.log("로그인 요청이 들어왔습니다.");
    console.log(req.body);

    if (!id) {
        return res.send("아이디를 입력해주세요.");
    }
    if (!password) {
        return res.send("비밀번호를 입력해주세요.");
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [id]
        );

        const user = result.rows[0];

        if (!user) {
            return res.send("존재하지 않는 아이디입니다.");
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.send("비밀번호가 일치하지 않습니다.");
        }

        req.session.user = user.username;
        console.log(req.session);

        res.redirect("/dashboard");
    }
    catch (err) {
        console.error(err);
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

// 회원가입 라우트
app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/views/signup.html");
})
app.post("/signup", async (req, res) => {
    const id = req.body.id?.trim();
    const password = req.body.password?.trim();
    const confirmpassword = req.body.confirmpassword?.trim();

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
    }       // 유효성 검사 완료

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // 10은 saltRounds로, 해시를 생성할 때 사용할 솔트의 수를 나타냅니다. 숫자가 클수록 보안이 강화되지만, 해시 생성 속도가 느려집니다.
        await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2)",
            [id, hashedPassword] // 비밀번호를 해시하여 데이터베이스에 저장
        );

        res.send("회원가입 완료");
    } catch (err) {
        console.error(err);

        if (err.code === "23505") {
            return res.send("이미 존재하는 아이디입니다.");
        }
        return res.send("회원가입 실패");
    }
});


// 자산 등록 폼 get라우트
app.get("/assets/add", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(__dirname + "/views/assets-add.html");
});

// 자산 등록 처리 post라우트
app.post("/assets/add", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    const category = req.body.category?.trim();
    const spec = req.body.spec?.trim();
    const vendor = req.body.vendor?.trim();
    const quantity = parseInt(req.body.quantity?.trim());
    const createdBy = req.session.user;

    console.log("자산 등록 요청이 들어왔습니다.");
    console.log(req.body);

    if (!category) {
        return res.send("카테고리를 선택해주세요.");
    }
    if (!spec) {
        return res.send("스펙을 선택해주세요.");
    }
    if (!quantity) {
        return res.send("수량을 입력해주세요.");
    }

    try {
        await pool.query(
            "INSERT INTO assets (category, spec, vendor, quantity, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $5)",
            [category, spec, vendor, quantity, createdBy]
        );

        res.send("자산 등록 완료");
    } catch (err) {
        console.error(err);
        res.send("자산 등록 실패");
    }
});

// 자산 목록 조회 API
app.get("/api/assets", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "로그인이 필요합니다."});
    }

    try {
        const result = await pool.query("SELECT * FROM assets ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "자산 목록 조회 실패"});
    }
});

// 자산 목록 라우트
app.get("/assets/list", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(__dirname + "/views/assets-list.html");
});

// 서버 시작
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});