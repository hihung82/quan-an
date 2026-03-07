export default async function handler(req, res) {

  // chỉ chấp nhận POST
  if (req.method !== "POST") {
    return res.status(200).send("ok")
  }

  console.log("TELEGRAM DATA:", req.body)

  res.status(200).send("ok")
}