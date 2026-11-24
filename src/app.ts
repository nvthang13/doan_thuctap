// Nạp thư viện express đã cài trong node_modules
import express,{Request, Response} from "express";

// Tạo ứng dụng (server) express
const app = express();

// Khi ai đó truy cập địa chỉ "/" thì trả về chuỗi này
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});
app.get("/about", (req: Request, res: Response) => {
  res.json({
    name: "Nguyen Van A",
    age: 30,
    job: "Developer"
  });
});

// Cho server lắng nghe ở cổng 8080
app.listen(8080, () => {
  console.log("Server đang chạy ở http://localhost:8080");
});