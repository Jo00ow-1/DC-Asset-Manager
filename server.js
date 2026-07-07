const express = require('express');
const app = express();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.post("/login", (req, res) => {
    console.log("로그인 요청이 들어왔습니다.");
    console.log(req.body);
    if (req.body.id === "josh" &&
        req.body.password === "1234"
     ) {
        res.redirect("dashboard.html");
    } else {
        res.send("로그인 실패");
    }
});
