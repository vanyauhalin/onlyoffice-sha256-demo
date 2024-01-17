# onlyoffice-sha256-demo

Clone the repository.

```sh
$ gh repo clone vanyauhalin/onlyoffice-sha256-demo
```

Go to the directory.

```sh
$ cd onlyoffice-sha256-demo
```

Build and up containers.

```sh
$ docker-compose up --build
```

When the Document Server is ready, run the following command in a second terminal session.

```sh
$ curl http://localhost:3000/start
```

The result will be similar to this.

```log
Start with the document.docx.
6940 457dc57108e797a7c429f7488ee92f92c627cb972093b6feb13be27fe25f5e27

Start converting the document.docx to the result.docxf.
POST http://onlyoffice-document-server/ConvertService.ashx {"async":false,"filetype":"docx","key":"document.docx","outputtype":"docxf","title":"result.docxf","url":"http://server:3000/document.docx"}
{"fileUrl":"http://onlyoffice-document-server/cache/files/data/conv_document.docx_docxf/output.docxf/result.docxf?md5=HjdlhWe11ehl1a_yH1bGoQ&expires=1705479412&filename=result.docxf","fileType":"docxf","percent":100,"endConvert":true}

Start downloading the result.docxf.
GET http://onlyoffice-document-server/cache/files/data/conv_document.docx_docxf/output.docxf/result.docxf?md5=HjdlhWe11ehl1a_yH1bGoQ&expires=1705479412&filename=result.docxf
7982 5985738855e7fa9d8a90426d5118e8fc075f8ca96ac962c8818e63b983350522

Start converting the result.docxf to the result.docx.
POST http://onlyoffice-document-server/ConvertService.ashx {"async":false,"filetype":"docxf","key":"result.docxf","outputtype":"docx","title":"result.docx","url":"http://server:3000/result.docxf"}
{"fileUrl":"http://onlyoffice-document-server/cache/files/data/conv_result.docxf_docx/output.docx/result.docx?md5=ierzKn5_fywPvWor1QB5iw&expires=1705479413&filename=result.docx","fileType":"docx","percent":100,"endConvert":true}

Start downloading the result.docx.
GET http://onlyoffice-document-server/cache/files/data/conv_result.docxf_docx/output.docx/result.docx?md5=ierzKn5_fywPvWor1QB5iw&expires=1705479413&filename=result.docx
7982 5985738855e7fa9d8a90426d5118e8fc075f8ca96ac962c8818e63b983350522
```

The `document.docx` file was obtained from [here](https://github.com/ONLYOFFICE/document-templates/blob/de7b54e5ed6ae10291e8473e13cab0cc63ab78e7/en-US/new.docx).
