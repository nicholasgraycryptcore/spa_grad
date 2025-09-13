const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'grad.db'));
db.serialize(() => {
  db.all("PRAGMA table_info('students')", (err, cols) => {
    if (err) return console.error('pragma error', err);
    console.log('Columns:', cols.map(c => `${c.cid}:${c.name}(${c.type})`).join(', '));
    db.get('SELECT * FROM students LIMIT 1', (err2, row) => {
      if (err2) return console.error('select error', err2);
      console.log('Sample row:', row);
      db.get('SELECT ID, typeof(ID) as t FROM students LIMIT 5', (err3, row2) => {
        if (err3) return console.error(err3);
        console.log('ID typeof:', row2);
        db.close();
      });
    });
  });
});

