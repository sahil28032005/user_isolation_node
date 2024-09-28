const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const pty = require('node-pty');
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const chokidar = require('chokidar');
require('dotenv').config();
const { exec } = require('child_process');
app.use(cors());
const server = http.createServer(app);
// console.log(server); logs testing
const io = socketIo(server, {
    cors: {
        origin: "*", // or '*' to allow all origins
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});
//middleware for extracting userId for anywhere use
function extractUserId(req, res, next) {
    console.log("extraction middleware called");
    const userId = req.query.userId || req.body.userId;
    if (userId) {
        req.userId = userId;
        console.log("extraction done successfully!");
        next();
    }
    else {
        return res.status(404).send("user id is required");
    }
}
//sutom routes
app.use(express.json());


const ioClient = require('socket.io-client');
const { stdout } = require('process');

//make custom port to run node/web server
const PORT = process.env.PORT || 5000;



//pty terminal process setup
// const usersDir = process.env.INIT_CWD
//     ? path.join(process.env.INIT_CWD, 'user')
//     : path.join(__dirname, 'user');
// const ptyProcess = pty.spawn(shell, [], {
//     name: 'tty',
//     cols: 80,
//     rows: 30,
//     cwd: usersDir,
//     env: process.env

// });

// //pty process listener prebuilt
// ptyProcess.on('data', function (data) {
//     console.log(data);
//     io.emit('terminal:data', data);
// });

//writer command for testing
// ptyProcess.write('mkdir abc.txt\r');



//listerning module for socker connectors socket.io connectiions
io.on('connection', (socket) => {
    console.log("some user connected to centralized docker server", socket.id);
    //receive user soecific unique identifier for mappin to his specific follder
    const userId = socket.handshake.query.userId;

    if (!userId) {
        //herer idea is to run shelll script as we got our new user first time
        console.log("user id not arrived,generating new user ID....");
        return res.status(404).send("socket connection has no userId specified!");
        // exec('./start-user-container.sh', (err, stdout, stderr) => {
        //     if (err) {
        //         console.error(`Error: ${stderr}`);
        //         socket.disconnect();
        //         return;
        //     }
        //     console.log(`output: ${stdout}`);
        // });

        // //try to extract details from script output
        // userId = stdout.match(/User ID: (.*)/)[1];
        // const workspaceDir = stdout.match(/Workspace Directory: (.*)/)[1];

        // //setup connectiion with newly generated user
        // setupUserConnection(socket, userId, workspaceDir);
    }
    else {
        //this code works by considering server is currently on otherwise this won't work as expected
        console.log("insdie else part");
        const userWorkspaceDir = path.join(__dirname, 'workspaces', userId);

        //check weather path sync exists or not
        if (!fs.existsSync(userWorkspaceDir)) {
            console.log(`User directory for ${userId} does not exist. Creating...`);

            //creating directory only if user provided id has not directory sync present 
            fs.mkdirSync(userWorkspaceDir, { recursive: true });
            console.log(`Directory created for user ${userId} at ${userWorkspaceDir}`);

            //here user needs to be mapped with his workspace which is newly created using same helper function as used in else part
            // setupUserConnection(socket, userId, userWorkspaceDir); //no need because after folder generation user must login and create repository and then connect
            
        }
        else{
            console.log(`Directory already exists for user ${userId}`);
            setupUserConnection(socket, userId, userWorkspaceDir);
        }
        
    }

    // //store userId inside socket
    // socket.userId = userId;

    // //spin docker container for particulae user here via mapping his diretory structure
    // console.log(`Handling connection for user ID: ${userId}`);
    // const userWorkspaceDir = path.join(__dirname, 'workspaces', userId, 'workspaces');
    // emitFileStructure(userWorkspaceDir);
    // console.log("userWorkspaceDir: ", userWorkspaceDir);
    // const ptyProcess = pty.spawn(shell, [], {
    //     name: 'xterm-color',
    //     cols: 80,
    //     rows: 30,
    //     cwd: userWorkspaceDir,  // Set the working directory to the user's workspace
    //     env: process.env
    // });

    // ptyProcess.on('data', function (data) {
    //     console.log(data);
    //     io.emit('terminal:data', data);
    // });

    // // const testscript = exec('start-user-container.sh /');
    // // exec('./start-user-container.sh', (err, stdout, stderr) => {
    // //     if (err) {
    // //         console.error(`Error: ${stderr}`);
    // //         // res.status(500).send('Failed to start session');
    // //         return;
    // //     }
    // //     console.log(`Output: ${stdout}`);

    // //     //extract details from script output termianl
    // //     const userId = stdout.match(/User ID: (.*)/)[1];
    // //     const workspaceDir = stdout.match(/Workspace Directory: (.*)/)[1];


    // // });
    // //listern custom events gere
    // socket.on('chat_message', (msg) => {
    //     console.log('Message received:', msg);
    //     ptyProcess.write(`${msg}\r`);
    //     // io.emit('chat_message', msg);
    //     // This line is correct if 'sg' is the command you want to send
    // });

    // //for file structure updates
    // // Emit initial file structure


    // // Set up chokidar watcher for the user's workspace directory
    // const watcher = chokidar.watch(userWorkspaceDir, {
    //     persistent: true,
    //     ignoreInitial: true,
    // });

    // // Listen for file changes in user's directory
    // watcher.on('all', (event, filePath) => {
    //     console.log(`${event} event occurred on ${filePath}`);
    //     emitFileStructure(userWorkspaceDir);
    // });



    // //spcket disconnection
    // socket.on('disconnect', () => {
    //     console.log("user disconnected");
    // });

});
// app.post('/message', (req, res) => {
//     const msg = req.body.message;
//     io.emit('chat message', msg);
//     ptyProcess.write(`${msg}\r`);
//     res.status(200).send({ status: 'Message sent' });
// });


//making seperate connection file for user manageent
function setupUserConnection(socket, userId, userWorkspaceDir) {
    socket.userId = userId;
    console.log(`Handling connection for user ID: ${userId}`);
    emitFileStructure(userWorkspaceDir);
    console.log("User workspace directory: ", userWorkspaceDir);

    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: userWorkspaceDir,
        env: process.env
    });
    //if terminal has some command response this sends backt to all connected socket clients as advantage if using socket io
    ptyProcess.on('data', function (data) {
        console.log(data);
        io.emit('terminal:data', data);
    });
    //takes command for execution and write in it actuall terminal of docker containers terminal insted of using ssh
    
    socket.on('chat_message', (msg) => {
        console.log('Message received:', msg);
        ptyProcess.write(`${msg}\r`);
    });

    const watcher = chokidar.watch(userWorkspaceDir, {
        persistent: true,
        ignoreInitial: true,
    });

    watcher.on('all', (event, filePath) => {
        console.log(`${event} event occurred on ${filePath}`);
        emitFileStructure(userWorkspaceDir);
    });

    socket.on('disconnect', () => {
        console.log("User disconnected");
    });
}

//try to make initial get request which gets files in users own space
function getAllFiles(dirPath, baseDir) {
    const files = fs.readdirSync(dirPath);
    const tree = {};

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const relativePath = path.relative(baseDir, filePath); // Calculate the relative path

        if (fs.statSync(filePath).isDirectory()) {
            // Recursively get files from the directory and add to the tree
            tree[file] = getAllFiles(filePath, baseDir);
        } else {
            // Add file to the tree
            tree[file] = {};
        }
    });

    return tree;
}
app.get('/files', (req, res) => {
    // const userId = req.query.userId;
    console.log("inside getfiles", req.userId);
    const userWorkspaceDir = path.join(__dirname, 'workspaces', req.userId);
    if (!fs.existsSync(userWorkspaceDir)) {
        return res.status(404).send('user directory not found');
    }

    //get all data related to file tree structure
    const fileTree = getAllFiles(userWorkspaceDir, userWorkspaceDir);

    res.json(fileTree);
});


//route that acceots file writer requests to specified path
app.post('/write-file', (req, res) => {
    try {
        const { filePath, content } = req.body;
        const fullPath = path.join(__dirname, 'workspaces', req.userId, filePath);
        // console.log("writer path: " + fullPath);
        console.log("made final write path as", fullPath);
        //write arrived content using fs writer module
        fs.writeFile(fullPath, content, (error) => {
            if (error) {
                return res.status(500).json({ error: 'failed to write file' + error.message });
            }
            return res.status(200).json({ message: 'File written successfully' });
        });

        //otherwise got success for writing data to file


    }
    catch (err) {
        return res.status(401).send({
            success: false,
            message: 'problem for writing file from api',
            message: err.message
        });
    }
});

//route for read data frim selected file
app.get('/read-file', extractUserId, function (req, res) {
    try {
        console.log("inside readfile", req.userId);
        const { filePath } = req.query;
        console.log("arriven path: ", filePath);
        const fullPath = path.join(__dirname, 'workspaces', req.userId, filePath);
        console.log("full path: ", fullPath);
        fs.readFile(fullPath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ content: data });
        });
    }
    catch (err) {
        return res.status(401).send({
            success: false,
            messgae: 'error while reading file data',
            err: err.message
        });
    }

});
//hj
function emitFileStructure(userWorkspaceDir) {
    const files = getAllFiles(userWorkspaceDir, userWorkspaceDir);
    io.emit('file-structure-update', files);
}

server.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
    // const socket = ioClient(`http://localhost:${PORT}`);//testing web socket connection for learning purpose
    // socket.on('connect', () => {
    //     console.log('Client connected to server');
    // });

    // socket.on('chat message', (msg) => {
    //     console.log('Message received from server:', msg);
    // });
});