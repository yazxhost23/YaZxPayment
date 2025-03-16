const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatContainer = document.getElementById('chat-container');
const typingIndicator = document.getElementById('typing-indicator');
const fileUpload = document.getElementById('file-upload');
const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const fileDescriptionModal = document.getElementById('file-description-modal');
const fileDescriptionInput = document.getElementById('file-description');
const sendFileButton = document.getElementById('send-file-button');
const closeModal = document.querySelector('.close-modal');

let uploadedFileContent = null;

// API Key Gemini (ganti dengan API key Anda)
const apiKey = "AIzaSyB01zhUpcSaz_jPn7Af9m4zgmEMfQ_aLcM"; // Ganti dengan API key Gemini Anda

// Aktifkan/nonaktifkan tombol kirim berdasarkan input
messageInput.addEventListener('input', () => {
    sendButton.disabled = messageInput.value.trim() === '';
    
    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight > 50) ? 
        Math.min(messageInput.scrollHeight, 150) + 'px' : '50px';
});

// Event listener untuk tombol enter (membuat baris baru, tidak mengirim pesan)
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Mencegah pengiriman pesan
        const startPos = messageInput.selectionStart;
        const endPos = messageInput.selectionEnd;
        const value = messageInput.value;

        // Menambahkan baris baru di posisi kursor
        messageInput.value = value.substring(0, startPos) + '\n' + value.substring(endPos);

        // Memindahkan kursor ke posisi setelah baris baru
        messageInput.selectionStart = messageInput.selectionEnd = startPos + 1;

        // Auto-resize textarea
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
    }
});

// Event listener untuk tombol kirim
sendButton.addEventListener('click', sendMessage);

// Event listener untuk upload file
fileUpload.addEventListener('change', handleFileUpload);

// Event listener untuk menutup modal
closeModal.addEventListener('click', () => {
    fileDescriptionModal.style.display = 'none';
});

// Event listener untuk mengirim file dengan deskripsi
sendFileButton.addEventListener('click', () => {
    const description = fileDescriptionInput.value.trim();
    if (uploadedFileContent && description) {
        const file = fileUpload.files[0];
        if (file.type.startsWith('image/')) {
            addImageMessage('Anda', uploadedFileContent, file.name, description, 'user-message');
        } else {
            addMessage('Anda', `${file.name}\n${description}`, 'user-message');
        }
        sendFileContentToAI(uploadedFileContent);
        fileDescriptionModal.style.display = 'none';
        fileDescriptionInput.value = '';
        uploadedFileContent = null;
    }
});

async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText === '') return;
    
    // Tambahkan pesan pengguna ke chat
    addMessage('Anda', messageText, 'user-message');
    
    // Reset input
    messageInput.value = '';
    messageInput.style.height = '50px';
    sendButton.disabled = true;
    
    // Tampilkan indikator mengetik
    typingIndicator.style.display = 'flex';
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Simulasi pemrosesan AI (penundaan acak)
    setTimeout(async () => {
        // Sembunyikan indikator mengetik
        typingIndicator.style.display = 'none';
        
        // Tentukan respons
        let response = await getGeminiResponse(messageText);
        
        // Tambahkan respons AI ke chat
        addMessage('YazX AI (Beta)', response, 'ai-message');
    }, Math.random() * 1000 + 1000); // Penundaan 1-2 detik
}

async function getGeminiResponse(text) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: text }]
                }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "Maaf, saya tidak tahu jawabannya.";
        }
    } catch (error) {
        console.error("Error fetching YazX AI response:", error);
        return "Terjadi kesalahan saat memproses permintaan.";
    }
}

function addMessage(sender, text, messageClass) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${messageClass}`;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    headerDiv.textContent = sender;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMessage(text);
    
    // Tambahkan tombol salin jika ada blok kode
    const codeBlocks = contentDiv.querySelectorAll('pre code');
    codeBlocks.forEach((codeBlock, index) => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Salin';
        copyButton.style.position = 'absolute';
        copyButton.style.top = '10px';
        copyButton.style.right = '10px';
        copyButton.style.backgroundColor = '#4CAF50';
        copyButton.style.color = 'white';
        copyButton.style.border = 'none';
        copyButton.style.borderRadius = '4px';
        copyButton.style.padding = '5px 10px';
        copyButton.style.cursor = 'pointer';
        copyButton.onclick = () => copyCode(codeBlock);
        
        // Tambahkan tombol salin ke dalam blok kode
        const preElement = codeBlock.parentElement;
        preElement.style.position = 'relative';
        preElement.appendChild(copyButton);
    });
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);
    
    chatContainer.insertBefore(messageDiv, typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Highlight kode
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });
}

function addImageMessage(sender, imageSrc, fileName, description, messageClass) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${messageClass}`;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    headerDiv.textContent = sender;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const imageElement = document.createElement('img');
    imageElement.src = imageSrc;
    imageElement.alt = fileName;
    imageElement.style.maxWidth = '100%';
    imageElement.style.borderRadius = '12px';
    imageElement.style.marginBottom = '10px';
    
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = `${description}`;
    
    contentDiv.appendChild(imageElement);
    contentDiv.appendChild(descriptionElement);
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);
    
    chatContainer.insertBefore(messageDiv, typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function formatMessage(text) {
    // Deteksi dan format kode
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Format paragraf
    const paragraphs = text.split('\n\n');
    if (paragraphs.length > 1) {
        return paragraphs.map(p => `<p>${p}</p>`).join('');
    }
    
    return text;
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        uploadProgress.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        const reader = new FileReader();
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentLoaded = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percentLoaded + '%';
                progressText.textContent = percentLoaded + '%';
            }
        };

        reader.onload = (e) => {
            if (file.type.startsWith('image/')) {
                uploadedFileContent = e.target.result;
            } else {
                uploadedFileContent = `${file.name}`;
            }
            uploadProgress.style.display = 'none';
            fileDescriptionModal.style.display = 'flex';
        };

        reader.readAsDataURL(file);
    }
}

function sendFileContentToAI(content) {
    typingIndicator.style.display = 'flex';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    setTimeout(async () => {
        typingIndicator.style.display = 'none';
        let response = await getGeminiResponse(content);
        addMessage('YazX AI (Beta)', response, 'ai-message');
    }, Math.random() * 1000 + 1000);
}

// Fungsi untuk menyalin kode ke clipboard
function copyCode(codeBlock) {
    navigator.clipboard.writeText(codeBlock.innerText)
        .then(() => {
            alert("Kode berhasil disalin!");
        })
        .catch(() => {
            alert("Gagal menyalin kode.");
        });
}