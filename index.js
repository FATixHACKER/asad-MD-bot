// --- POWERFUL MD BOT V3 (Sticker + AntiLink + Welcome + YT Audio) --- //
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// New Libraries
const Canvas = require('canvas');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');

ffmpeg.setFfmpegPath(ffmpegPath);

// Settings
const botName = "∆SAD T£CH BOT";
const prefix = '!';

// --- HELPER FUNCTION: WELCOME CARD BANANA --- //
const makeWelcomeCard = async (jid, text, profilePicUrl) => {
    const canvas = Canvas.createCanvas(1024, 500);
    const ctx = canvas.getContext('2d');

    // 1. Background Load karo (background.jpg folder mein honi chahiye)
    try {
        const background = await Canvas.loadImage('./background.jpg');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch (e) {
        // Agar background image na mile to kala rang bhar do
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Dark Overlay (Taake text saaf nazar aaye)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Profile Picture ka Circle banana
    ctx.save();
    ctx.beginPath();
    ctx.arc(512, 150, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    try {
        // User ki DP download karke lagao
        const imgData = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
        const profile = await Canvas.loadImage(imgData.data);
        ctx.drawImage(profile, 412, 50, 200, 200);
    } catch (e) {
        // Agar DP na ho to koi default image
        // ctx.fillStyle = '#ffffff'; ctx.fill(); // Filhal safed circle
    }
    ctx.restore();

    // 4. Text Likhna
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Welcome Text
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText(text, 512, 320);
    
    // User Name/Number
    ctx.font = '40px sans-serif';
    ctx.fillText(`@${jid.split('@')[0]}`, 512, 380);
    
    // Bot Name Footer
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#e0e7ff';
    ctx.fillText(`Welcome to the party! | ${botName}`, 512, 450);

    return canvas.toBuffer();
};


// --- MAIN START FUNCTION --- //
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    console.log(`🚀 ${botName} Starting with ALL FEATURES...`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ["ASAD Tech", "Ultimate", "3.0.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot Connected! Welcome & YT Downloader Ready.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ============================================================
    // 🌟 FEATURE 1: PROFESSIONAL WELCOME & GOODBYE IMAGE
    // ============================================================
    sock.ev.on('group-participants.update', async (anu) => {
        try {
            // Profile Picture nikalna
            let profilePicUrl;
            try {
                profilePicUrl = await sock.profilePictureUrl(anu.participants[0], 'image');
            } catch {
                // Agar privacy lagi ho to default image
                profilePicUrl = 'https://i.ibb.co/Tq7d7TZ/age-hananta-495-photo.png'; 
            }

            if (anu.action === 'add') {
                // WELCOME MESSAGE
                const buffer = await makeWelcomeCard(anu.participants[0], 'WELCOME JANI!', profilePicUrl);
                await sock.sendMessage(anu.id, { image: buffer, caption: `Hey @${anu.participants[0].split('@')[0]}, Welcome to the group! 🎉`, mentions: [anu.participants[0]] });
            } 
            else if (anu.action === 'remove') {
                // GOODBYE MESSAGE
                const buffer = await makeWelcomeCard(anu.participants[0], 'GOODBYE!', profilePicUrl);
                await sock.sendMessage(anu.id, { image: buffer, caption: `Sad to see you go, @${anu.participants[0].split('@')[0]}. 👋`, mentions: [anu.participants[0]] });
            }
        } catch (err) {
            console.log("Welcome Error:", err);
        }
    });


    // ============================================================
    // 🌟 MAIN MESSAGE HANDLER (Commands)
    // ============================================================
    sock.ev.on('messages.upsert', async m => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const type = Object.keys(msg.message)[0];
            const content = type === 'conversation' ? msg.message.conversation : 
                            type === 'extendedTextMessage' ? msg.message.extendedTextMessage.text : 
                            type === 'imageMessage' ? msg.message.imageMessage.caption : '';
            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;
            const reply = (text) => sock.sendMessage(from, { text: text }, { quoted: msg });

            // --- Anti-Link (Existing code) ---
            if (isGroup && (content.includes('chat.whatsapp.com') || content.includes('http'))) {
                 const groupMetadata = await sock.groupMetadata(from);
                 const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
                 if (!isAdmin) {
                     await sock.sendMessage(from, { delete: msg.key });
                     await sock.sendMessage(from, { text: `🚫 Links not allowed!`, mentions: [sender] });
                 }
            }

            if (!content.startsWith(prefix)) return;
            const args = content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            const textQuery = args.join(' ');

            switch (command) {
                case 'menu':
                    reply(`🔥 *${botName} ULTIMATE MENU* 🔥\n\n🎵 *Music:*\n${prefix}song [ganay ka naam]\n\n🖼️ *Media:*\n${prefix}sticker (Reply image)\n\n🎉 *Group:*\nAuto Welcome/Goodbye Image\nAnti-Link System\n${prefix}kick @user\n${prefix}tagall`);
                    break;

                // --- 🎵 FEATURE 2: YOUTUBE SONG DOWNLOADER --- //
                case 'song':
                case 'play':
                    if (!textQuery) return reply('❌ Gaanay ka naam to likho! Example: !song Kahani Suno');
                    reply('🔍 Searching on YouTube...');

                    // 1. Search Song
                    const searchResults = await yts(textQuery);
                    const video = searchResults.videos[0];
                    
                    if (!video) return reply('❌ Koi video nahi mili is naam ki.');

                    reply(`⬇️ Downloading: *${video.title}* (${video.timestamp})...`);

                    // 2. Download Audio Stream
                    const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
                    const fileName = `./${Date.now()}.mp3`;
                    const fileStream = fs.createWriteStream(fileName);

                    // Save to file
                    stream.pipe(fileStream);

                    fileStream.on('finish', async () => {
                        // 3. Send Audio
                        await sock.sendMessage(from, { 
                            audio: { url: fileName }, 
                            mimetype: 'audio/mp4', 
                            ptt: false, // True karoge to voice note ban jayega
                            fileName: video.title + '.mp3'
                        }, { quoted: msg });
                        
                        // Cleanup
                        fs.unlinkSync(fileName);
                    });

                    fileStream.on('error', (err) => {
                        reply('❌ Downloading mein error aa gaya.');
                        if(fs.existsSync(fileName)) fs.unlinkSync(fileName);
                    });
                    break;

                // --- Sticker Command (Existing) ---
                case 'sticker': case 's':
                    // ... (Pichla sticker code yahan assume kar raha hoon jagah bachanay ke liye)
                    // Agar tumhara pichla code chalta tha to wo hissa yahan hona chahiye
                    reply('Sticker command purane code se copy kar lena agar chahiye to.');
                    break;

                // --- Admin Commands ---
                case 'kick':
                    if(!isGroup) return reply('Group only');
                    // ... (Pichla kick code)
                    break;
                case 'tagall':
                    if(!isGroup) return reply('Group only');
                    // ... (Pichla tagall code)
                     break;
            }

        } catch (err) {
            console.log("Error:", err);
        }
    });
}
startBot();