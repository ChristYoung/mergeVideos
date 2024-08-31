#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取命令行参数
const videoDir = process.argv[2] || '.'; // 使用命令行传入的视频文件目录，默认为当前目录
const outputVideo = process.argv[3] || 'output.mp4'; // 输出文件名
const txtFileName = process.argv[4] || 'filelist.txt'; // 文件列表文件名
const fileListPath = path.join(videoDir, `${txtFileName}`);

// 生成文件列表
function generateFileList () {
    const files = fs.readdirSync(videoDir)
        .filter(file => file.endsWith('.mp4'))
        .map(file => `file '${path.join(videoDir, file)}'`)
        .join('\n');

    fs.writeFileSync(fileListPath, files, 'utf8');
}

// 显示加载动画
function showLoading () {
    const frames = ['-', '\\', '|', '/'];
    let i = 0;

    return setInterval(() => {
        process.stdout.write(`\rMerging videos... ${frames[i++]}`);
        i %= frames.length;
    }, 100);
}

function Main () {
    const loadingInterval = showLoading();
    // 实现将.ts文件转换为.mp4文件的功能
    fs.readdir(videoDir, (err, files) => {
        if (err) throw err;
        files.forEach(file => {
            if (file.endsWith('.ts') || file.endsWith('.TS')) {
                const input = path.join(videoDir, file);
                const output = path.join(videoDir, file.replace('.ts', '.mp4').replace('.TS', '.mp4'));
                fs.rename(input, output, (err) => {
                    if (err) throw err;
                    console.log(`${input} has been renamed to ${output}`);
                })
            }
        });
        mergeVideos();
        clearInterval(loadingInterval);
    });
}


// 运行FFmpeg命令合并视频
function mergeVideos () {
    generateFileList();
    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${txtFileName} -c copy ${outputVideo}`;

    exec(ffmpegCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`FFmpeg stderr: ${stderr}`);
            return;
        }
        console.log(`FFmpeg stdout: ${stdout}`);
        console.log('Videos merged successfully!');

        // 清理文件列表
        fs.unlinkSync(fileListPath);
    });
}

// 执行
Main();
