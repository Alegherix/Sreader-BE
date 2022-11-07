import express from 'express';
const app = express();
import fileUpload from "express-fileupload";
import pdf from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import cors from "cors";
const port = process.env.PORT || 80;
const pdfQueue = new Map();
const pdfChunkQueue = new Map();
app.use(cors());
app.use(fileUpload());
const splitText = (text, amount) => {
    let chunks = {};
    text.split(' ').reduce((acc, word, index) => {
        const key = Math.floor(index / amount);
        acc[key] = acc[key] ? acc[key] + ' ' + word : word;
        return acc;
    }, chunks);
    return chunks;
};
app.get('/pdf/:id', (req, res) => {
    const pdf = pdfQueue.get(req.params.id);
    if (pdfChunkQueue.get(req.params.id) && req.query.chunk) {
        let chunk = req.query.chunk;
        res.send({ text: pdfChunkQueue.get(req.params.id)?.[chunk] ?? 'No text found' });
    }
    else if (pdf) {
        const chunks = splitText(pdf.text, 5000);
        const chunksLength = Object.keys(chunks).length;
        pdfChunkQueue.set(req.params.id, chunks);
        res.status(200).send({ pages: pdf.numpages, text: chunks[0], chunks: chunksLength });
    }
    else {
        res.status(404).send('Not found');
    }
});
app.post("/pdf", (req, res) => {
    const file = req.files?.pdf;
    if (!file || !file) {
        console.log("No file received");
        res.status(400).send("No files were uploaded.");
        return;
    }
    else if (file.mimetype !== "application/pdf") {
        console.log("File is not a PDF");
        res.status(400).send("Wrong file type");
        return;
    }
    pdf(file.data).then(data => {
        const id = uuidv4();
        // TODO - Bring back uuid again
        pdfQueue.set("1", data);
        console.log("PDF uploaded");
        console.log("Returning ID", id);
        res.status(200).send({ id });
        return;
    });
});
app.listen(process.env.PORT || 5000, () => console.log('server started'));
