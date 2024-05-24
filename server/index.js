const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const multer = require('multer');


app.use(cors());
app.use(express.json());
//await pool.connect();
const upload = multer({ dest: 'uploads/' }); 

app.listen(5003, () =>
{
    console.log("listening to Sid's port 5000");
});

app.post("/sregister", async(req,res)=>{
    console.log('Hello');
    console.log('desc ',req.body);
    try {
        const {username, password} = req.body;
        console.log(username);// name is username, email is password
        const newuser = await pool.query("INSERT INTO auth Values($1,$2)",[username,password]);
        const nu=await pool.query("INSERT INTO student (username) VALUES ($1)", [username]);
        
        res.status(200);
    } catch (error) {
        console.log(error.message);
    }
    res.send("user successfully registered");
}),


    app.post("/ssignin", async (req, res) => {
        try {
            const { username, password } = req.body;
            
            // Query the database to find a user with the provided username and password
            const newuser = await pool.query("SELECT * FROM auth WHERE name = $1 AND password = $2", [username, password]);
            
            if (newuser.rows.length === 0) {
                // No user found with the provided credentials
                return res.status(401).json({ error: "Invalid username or password" });
            }
            
            // User authenticated successfully
            res.status(200).json({ message: "Sign-in successful", newuser: newuser.rows[0] });
        } catch (error) {
            console.error("Error signing in:", error.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
}),


app.post("/fregister", async (req, res) => {
    console.log('desc ', req.body);
    try {
        const { facultyId, username, password } = req.body;
        console.log(username);// name is username, email is password
        const newuser = await pool.query("INSERT INTO teach VALUES($1,$2,$3)", [username, password, facultyId]);
        res.status(200).json({ message: "User successfully registered" });
    } catch (error) {
        console.log(error.message);
        if (error.message.includes('duplicate key value violates unique constraint "unique_username_constraint"')) {
            res.status(400).json({ error: 'Username already exists' });
        } else if (error.message.includes('duplicate key value violates unique constraint "teach_pkey"')) {
            res.status(400).json({ error: 'Faculty ID already registered' });
        } else {
            res.status(500).json({ error: 'An error occurred while registering faculty' });
        }
    }
}),






app.post("/fsignin", async (req, res) => {
    try {
        const { facultyId, username, password } = req.body;
        
        // Query the database to find a user with the provided username and password
        const newuser = await pool.query("SELECT * FROM teach WHERE username = $1 AND password = $2 AND fid = $3", [username, password,facultyId]);
        
        if (newuser.rows.length === 0) {
            // No user found with the provided credentials
            return res.status(401).json({ error: "Invalid username or password" });
        }
        
        // User authenticated successfully
        res.status(200).json({ message: "Sign-in successful", newuser: newuser.rows[0] });
    } catch (error) {
        console.error("Error signing in:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}),
app.post("/update-timings", async (req, res) => {
    try {
      const { facultyId, dayOfWeek, startTime, endTime } = req.body;
        console.log("Hi",req.body);
        console.log("Faculty id:",facultyId);
        console.log("Day:",dayOfWeek);
        console.log("Start:",startTime);
        console.log("End:",endTime);
      // Get current time
      const currentTime = new Date();
  
      // Insert or update the timings in the database
      const result = await pool.query(
        `INSERT INTO faculty_schedule (fid, day_of_week, start_time, end_time, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (fid, day_of_week)
         DO UPDATE SET start_time = $3, end_time = $4, updated_at = $5`,
        [facultyId, dayOfWeek, startTime, endTime, currentTime]
      );
  
      res.status(200).send("Timings updated successfully");
    } catch (error) {
      console.error("Error updating timings:", error);
      res.status(500).send("Internal Server Error");
    }
}),

app.put("/update-existing-timings", async (req, res) => {
    try {
      const { facultyId, dayOfWeek, startTime, endTime } = req.body;
  
      // Get current time
      const currentTime = new Date();
  
      // Update the timings in the database
      const result = await pool.query(
        `UPDATE faculty_schedule
         SET start_time = $1, end_time = $2, updated_at = $3
         WHERE fid = $4 AND day_of_week = $5`,
        [startTime, endTime, currentTime, facultyId, dayOfWeek]
      );
  
      res.status(200).send("Existing timings updated successfully");
    } catch (error) {
      console.error("Error updating existing timings:", error);
      res.status(500).send("Internal Server Error");
    }
  }),
  app.get('/get-live-status', async (req, res) => {
    try {
        const { facultyName } = req.query;

        // Retrieve live status and cabin details from the database for the specified faculty name
        const result = await pool.query(`
            SELECT f.fname, f.femail, f.fdept, f.live_status, c.fblock, c.ffloor, c.fcabinno
            FROM faculty f
            JOIN cabin c ON f.fid = c.fid
            WHERE f.fname = $1
        `, [facultyName]);

        if (result.rows.length === 0) {
            // Faculty member not found
            return res.status(404).json({ error: 'Faculty member not found' });
        }

        const { fname, femail, fdept, live_status, fblock, ffloor, fcabinno } = result.rows[0];
        res.status(200).json({ fname, femail, fdept, live_status, fblock, ffloor, fcabinno });
    } catch (error) {
        console.error('Error retrieving live status:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}),

  app.post("/update-live-status", async (req, res) => {
    try {
        const { facultyId, liveStatus } = req.body;

        // Update the live status in the database
        const result = await pool.query(
            "UPDATE faculty SET live_status = $1 WHERE fid = $2",
            [liveStatus, facultyId]
        );

        res.status(200).send("Live status updated successfully");
    } catch (error) {
        console.error("Error updating live status:", error.message);
        res.status(500).send("Internal Server Error: " + error.message); // Add error message to response
    }
}),

app.get('/get-student-details', async (req, res) => {
    try {
        const username = req.query.student;
        const query = 'SELECT * FROM student WHERE username = $1';
        const { rows } = await pool.query(query, [username]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}),

app.get('/get-all-live',async (req,res)=>{
    try {
        const query = await pool.query('SELECT f.fname,f.femail,f.fdept,c.ffloor,c.fblock,c.fcabinno from faculty f,cabin c WHERE f.live_status = true and f.fid=c.fid');
        res.json(query.rows);
    }
    catch (error) {
        console.error('Error storing comment:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}),

app.get('/get-faculties-one-subject', async (req, res) => {
    try {
        const { subject } = req.query;

        // Assuming 'fid' is the common column between 'faculty' and 'subject' tables
        const query = await pool.query('SELECT f.fname, s.section FROM faculty f INNER JOIN subject s ON f.fid = s.fid WHERE s.subject = $1', [subject]);

        res.json(query.rows);
    } catch (error) {
        console.error('Error fetching faculties teaching subject:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}),



app.get('/get-sub-sec', async (req, res) => {
    try {
        const { subject, section } = req.query;

        // Retrieve live status and cabin details from the database for the specified subject and section
        const result = await pool.query(`
            SELECT f.fname, f.femail, f.fdept, f.live_status, c.fblock, c.ffloor, c.fcabinno
            FROM faculty f
            JOIN cabin c ON f.fid = c.fid
            JOIN subject s ON f.fid = s.fid
            WHERE s.subject = $1 AND s.section = $2
        `, [subject, section]);

        if (result.rows.length === 0) {
            // No matching records found
            return res.status(404).json({ error: 'No matching records found' });
        }

        const { fname, femail, fdept, live_status, fblock, ffloor, fcabinno } = result.rows[0];
        res.status(200).json({ fname, femail, fdept, live_status, fblock, ffloor, fcabinno });
    } catch (error) {
        console.error('Error retrieving live status:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}),




app.post('/store-comment', async (req, res) => {
    try {
        const { username, comment, facultyName } = req.body;

        // Retrieve faculty ID (fid) based on the provided facultyName
        const facultyIdQuery = await pool.query(
            'SELECT fid FROM faculty WHERE fname = $1',
            [facultyName]
        );

        // Check if the facultyName exists
        if (facultyIdQuery.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Faculty not found.' });
        }

        const facultyId = facultyIdQuery.rows[0].fid;

        // Store the comment in the database
        const result = await pool.query(
            'INSERT INTO comments (username, comment, faculty_name, fid) VALUES ($1, $2, $3, $4)',
            [username, comment, facultyName, facultyId]
        );

        res.status(200).json({ success: true, message: 'Comment stored successfully.' });
    } catch (error) {
        console.error('Error storing comment:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}),

app.get('/faculty-comments', async (req, res) => {
    try {
        const { username } = req.query;

        // Query to fetch comments with faculty name by username
        const query = `
            SELECT fr.reply, f.fname AS faculty_name, fr.create_at
            FROM faculty_reply fr
            INNER JOIN faculty f ON fr.fid = f.fid
            WHERE fr.username = $1`;
        const result = await pool.query(query, [username]);

        res.json(result.rows); // Send the comments with faculty name as JSON response
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal Server Error' }); // Handle errors
    }
}),


app.post('/store-faculty-reply', async (req, res) => {
    try {
        console.log("function");
        const { username, reply, facultyId } = req.body;

        // Retrieve faculty ID (fid) based on the provided facultyName
       

        // Check if the facultyName exists

        //const facultyId = facultyIdQuery.rows[0].fid;

        // Store the comment in the database
        const result = await pool.query(
            'INSERT INTO faculty_reply (username, reply, fid) VALUES ($1, $2, $3)',
            [username, reply, facultyId]
        );

        res.status(200).json({ success: true, message: 'Comment stored successfully.' });
    } catch (error) {
        console.error('Error storing comment:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}),
  
  app.get('/get-comments', async (req, res) => {
    try {
        const { facultyId } = req.query;

        // Fetch comments for the specified facultyId from the database
        const comments = await pool.query(
            'SELECT * FROM comments WHERE fid = $1',
            [facultyId]
        );

        res.json(comments.rows);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}),



app.get('/get-faculty-id', async (req, res) => {
    try {
        //console.log("inside get-faculty-id");
        const { facultyName } = req.query;
        //console.log("facultyId",facultyId);
        const result = await pool.query('SELECT fid FROM faculty WHERE fname = $1', [facultyName]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Faculty not found' });
        } else {
            const facultyId = result.rows[0].fid;
            //console.log(facultyId);
            res.status(200).json({ facultyId });
        }
    } catch (error) {
        console.error('Error fetching facultyId:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}),

// Assuming you have a PostgreSQL database connection setup and imported as 'pool'

app.post('/submit-comment', async (req, res) => {
    try {
        const { facultyId, comment } = req.body;

        // Check if a record already exists for the facultyId
        const existingComment = await pool.query('SELECT * FROM faculty_messages WHERE fid = $1', [facultyId]);

        if (existingComment.rows.length > 0) {
            // Update the existing comment
            await pool.query('UPDATE faculty_messages SET message = $1 WHERE fid = $2', [comment, facultyId]);
            res.status(200).json({ message: 'Comment updated successfully' });
        } else {
            // Insert a new comment
            await pool.query('INSERT INTO faculty_messages (fid, message) VALUES ($1, $2)', [facultyId, comment]);
            res.status(200).json({ message: 'Comment submitted successfully' });
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}),
// Assuming you have a PostgreSQL database connection setup and imported as 'pool'

app.get('/get-comment', async (req, res) => {
    try {
        const { facultyId } = req.query;

        // Fetch the comment for the given facultyId
        const commentResult = await pool.query('SELECT message FROM faculty_messages WHERE fid = $1', [facultyId]);
        //console.log("Comment result:",commentResult);

        if (commentResult.rows.length > 0) {
            const comment = commentResult.rows[0].message;
            //console.log("Inside backend",comment);
            res.status(200).json({ comment });
            
        } else {
            res.status(404).json({ message: 'Comment not found' });
        }
    } catch (error) {
        console.error('Error fetching comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}),

app.post('/submit-reply', async (req, res) => {
    console.log("Inside submit reply backend");
    try {
        const { facultyId, facultyName, originalMessage, reply, username } = req.body;
        
        // Insert the reply into the database
        await pool.query('INSERT INTO faculty_reply (fid, fname, message, reply, username) VALUES ($1, $2, $3, $4, $5)', [facultyId, facultyName, originalMessage, reply, username]);
        
        res.status(200).json({ message: 'Reply submitted successfully' });
    } catch (error) {
        console.error('Error submitting reply:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Route to fetch faculty schedule based on facultyId
app.get('/get-faculty-schedule', async (req, res) => {
    try {
        const { facultyId } = req.query;
        const result = await pool.query('SELECT day_of_week,start_time,end_time FROM faculty_schedule WHERE fid = $1', [facultyId]);
        const scheduleData = result.rows;
        res.status(200).json(scheduleData);
    } catch (error) {
        console.error('Error fetching faculty schedule:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}),
app.post('/update-faculty-details', (req, res) => {
    const { facultyId, department, cabin, block,floor } = req.body;
    console.log(req.body);

    const facultySql = `
        UPDATE faculty
        SET fdept = $1
        WHERE fid = $2
    `;

    const cabinSql = `
        UPDATE cabin
        SET fcabinno = $1, fblock = $2, ffloor = $3
        WHERE fid = $4
    `;

    pool.query(facultySql, [department, facultyId], (err1, result1) => {
        if (err1) {
            console.error('Error updating faculty details:', err1);
            res.status(500).json({ error: 'Error updating faculty details' });
        } else {
            pool.query(cabinSql, [cabin, block,floor, facultyId], (err2, result2) => {
                if (err2) {
                    console.error('Error updating cabin details:', err2);
                    res.status(500).json({ error: 'Error updating cabin details' });
                } else {
                    console.log('Faculty and cabin details updated successfully');
                    res.json({ message: 'Faculty and cabin details updated successfully' });
                }
            });
        }
    });
});
app.post('/update-student-details', async (req, res) => {
    try {
        const { username, name, email, department, sem } = req.body;

        // Update the student details in the database
        const query = 'UPDATE student SET sname = $1, semail = $2, sdept = $3, ssem = $4 WHERE username = $5';
        await pool.query(query, [name, email, department, sem, username]);

        // Fetch the updated student details from the database
        const updatedQuery = 'SELECT * FROM student WHERE username = $1';
        const { rows } = await pool.query(updatedQuery, [username]);

        // Send the updated student details as a response
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        console.error('Error updating student details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/get-faculty-details', (req, res) => {
    const facultyId = req.query.facultyId;

    // Query to fetch faculty and cabin details using a join operation
    const sql = `
        SELECT faculty.fname, faculty.femail, cabin.fcabinno, cabin.fblock, faculty.fdept
        FROM faculty
        INNER JOIN cabin ON faculty.fid = cabin.fid
        WHERE faculty.fid = $1
    `;
    
    pool.query(sql, [facultyId], (err, result) => {
        if (err) {
            console.error('Error fetching faculty details:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (result.rows.length > 0) {
                res.json(result.rows[0]); // Send faculty details as JSON response
            } else {
                res.status(404).json({ error: 'Faculty details not found' }); // Send 404 error if faculty details not found
            }
        }
    });
});









