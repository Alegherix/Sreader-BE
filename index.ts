import express from 'express';
const app = express();
import fileUpload from "express-fileupload";
import pdf from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import cors from "cors";

const port = process.env.PORT || 80

type UploadedPDF = fileUpload.UploadedFile & { mimetype: string, name: string, data: Buffer };

type PDFQueue = Map<string, pdf.Result>;
const pdfQueue: PDFQueue = new Map();

app.use(cors())
app.use(fileUpload());

app.get('/pdf:id', (req, res) => {
    console.log("Getting PDF based on ID");
    const pdf = pdfQueue.get(req.params.id);
    if (pdf) {
        pdfQueue.delete(req.params.id);
        res.send(pdf);
    } else {
        res.status(404).send('Not found');
    }
});

app.get("/", (req, res) => {
    console.log("I was pinged");
    res.status(400).send("Hello World!");
    return;
})

app.get("/api", (req, res) => {
    return res.status(200).send({ message: "Hello World!" });
});

app.post("/pdf", (req, res) => {
    const file = req.files?.pdf as UploadedPDF;

    if(!file || !file) {
        console.log("No file received");
        res.status(400).send("No files were uploaded.");
        return;
    }    
    else if(file.mimetype !== "application/pdf"){
        console.log("File is not a PDF");
        res.status(400).send("Wrong file type");
        return;
    }
    pdf(file.data).then(data => {
        const id = uuidv4();
        pdfQueue.set(id, data);
        res.status(200).send({id});
        return;
    });
});

app.listen(process.env.PORT || 5000, () => console.log('server started'));