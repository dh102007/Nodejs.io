const http = require('http');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');

const template = {
  HTML: function (title, list, body, control) {
    return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>WEB1 - ${title}</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <h1><a href="/" class="titlename">WEB</a></h1>
      ${list}
      ${control}
      ${body}
    </body>
    </html>
    `;
  },
  list: function (filelist) {
    let list = '<ul class="link">';
    let i = 0;
    while (i < filelist.length) {
      const filename = filelist[i];
      list += `<li><a href="/?id=${encodeURIComponent(filename)}" class="addlink">${filename}</a></li>`;
      i++;
    }
    list += '</ul>';
    return list;
  }
};

const app = http.createServer((request, response) => {
  const _url = request.url;
  const queryData = url.parse(_url, true).query;
  const pathname = url.parse(_url, true).pathname;

  if (pathname === '/style.css') {
    fs.readFile('style.css', function (err, data) {
      if (err) {
        response.writeHead(404);
        response.end('Not found');
      } else {
        response.writeHead(200, { 'Content-Type': 'text/css' });
        response.end(data);
      }
    });
    return;
  }

  if (pathname === '/') {
    if (queryData.id === undefined) {
      fs.readdir('./data', function (error, filelist) {
        const title = 'Welcome';
        const description = 'Hello, Node.js';
        const list = template.list(filelist);
        const html = template.HTML(title, list,
          `<ul class="titletext"><li class="maintext"><h2>${title}</h2> <hr> <p>${description}</p></li></ul>`,
          `<button onclick="location.href='/create'" class="followers">create</button>`
        );
        response.writeHead(200);
        response.end(html);
      });
    } else {
      const decodedId = decodeURIComponent(queryData.id);
      fs.readdir('./data', function (error, filelist) {
        fs.readFile(`data/${decodedId}`, 'utf8', function (err, description) {
          const title = decodedId;
          const list = template.list(filelist);
          const html = template.HTML(title, list,
            `<ul class="titletext"><li class="maintext"><h2>${title}</h2> <hr><p>${description}</p></li></ul>`,
            ` <button onclick="location.href='/create'" class="followers">create</button>
              <button onclick="location.href='/update?id=${encodeURIComponent(title)}'" class="update">update</button>
              <form action="delete_process" method="post" class="btn">  
                <input type="hidden" name="id" value="${title}">
                <input type="submit" value="delete" class="delete">
              </form>`
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    }
  } else if (pathname === '/create') {
    fs.readdir('./data', function (error, filelist) {
      const title = 'WEB - create';
      const list = template.list(filelist);
      const html = template.HTML(title, list, `
        <form action="/create_process" method="post">
          <p class="name"><input type="text" name="title" placeholder="title" class="nametext"></p>
          <p class="text"><textarea name="description" placeholder="description" class="main"></textarea></p>
          <p class="btn"><input type="submit" class="submit"></p>
        </form>
      `, '');
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === '/create_process') {
    let body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      const post = qs.parse(body);
      const title = post.title;
      const description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
        response.writeHead(302, { Location: `/?id=${encodeURIComponent(title)}` });
        response.end();
      });
    });
  } else if (pathname === '/update') {
    const decodedId = decodeURIComponent(queryData.id);
    fs.readdir('./data', function (error, filelist) {
      fs.readFile(`data/${decodedId}`, 'utf8', function (err, description) {
        const title = decodedId;
        const list = template.list(filelist);
        const html = template.HTML(title, list,
          `<form action="/update_process" method="post">
            <input type="hidden" name="id" value="${title}">
            <p class="name"><input type="text" name="title" placeholder="title" value="${title}" class="nametext"></p>
            <p class="text"><textarea name="description" placeholder="description" class="main">${description}</textarea></p>
            <p class="name"><input type="submit" class="submit"></p>
          </form>`,
          `<button onclick="location.href='/create'" class="followersbtn">create</button>
           <button onclick="location.href='/update?id=${encodeURIComponent(title)}'" class="updatebtn">update</button>`
        );
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === '/update_process') {
    let body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      const post = qs.parse(body);
      const id = post.id;
      const title = post.title;
      const description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function (error) {
        fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
          response.writeHead(302, { Location: `/?id=${encodeURIComponent(title)}` });
          response.end();
        });
      });
    });
  } else if (pathname === '/delete_process') {
    let body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      const post = qs.parse(body);
      const id = post.id;
      fs.unlink(`data/${id}`, function (error) {
        response.writeHead(302, { Location: `/` });
        response.end();
      });
    });
  } else {
    response.writeHead(404);
    response.end('Not found');
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
