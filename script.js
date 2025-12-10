const supabaseUrl = 'https://gysfboiuufifyxydnprz.supabase.co'
const supabaseKey = 'sb_publishable_Sk3JxNOIHCzM8rVi3PWQcw_u1SrYl4O'

const API_HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
};

const CATEGORIES = {
    'senhor-ninguem': { label: 'Cartas ao Senhor Ninguém', icon: 'feather', desc: 'Confissões para o vazio.' },
    'cartas': { label: 'Cartas', icon: 'file-text', desc: 'Correspondências da alma.' },
    'post-its': { label: 'Post-its', icon: 'clipboard', desc: 'Fragmentos de pensamento.' },
    'composicoes': { label: 'Composicoes', icon: 'music', desc: 'A música das palavras.' },
    'poesias': { label: 'Poesias', icon: 'book', desc: 'Versos livres.' },
    'aleatorios': { label: 'Aleatórios', icon: 'pen-tool', desc: 'O caos organizado.' }
};

let posts = [];
let currentView = 'home';
let selectedCategory = null;
let currentPost = null;

const appContainer = document.getElementById('app');
const mainContent = document.getElementById('main-content');
const homeBtn = document.getElementById('home-btn');
const createBtn = document.getElementById('create-btn');

async function fetchPosts() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/posts?select=*`;
        const response = await fetch(url, { headers: API_HEADERS });
        const data = await response.json();

        posts = data || [];
        posts.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    } catch (error) {
        console.error("Erro ao buscar posts:", error);
    }
}

async function handleSavePost(titulo, conteudo, categoria) {
    if (!conteudo || (!titulo && categoria !== 'post-its')) {
        alert('O vazio não pode ser publicado.');
        return;
    }

    const postData = {
        titulo: categoria === 'post-its'
            ? `Post-it nº ${posts.filter(p => p.categoria === 'post-its').length + 1}`
            : titulo,
        conteudo,
        categoria,
        dataCriacao: new Date().toISOString()
    };

    try {
        await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
            method: "POST",
            headers: {
                ...API_HEADERS,
                "Content-Type": "application/json",
                Prefer: "return=representation"
            },
            body: JSON.stringify(postData)
        });

        await fetchPosts();
        setView('home');
    } catch (error) {
        console.error("Erro ao salvar post:", error);
        alert("Falha ao salvar a memória.");
    }
}

async function handleDelete(id) {
    if (!confirm('Deseja apagar esta memória?')) return;

    try {
        await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
            method: "DELETE",
            headers: API_HEADERS
        });

        await fetchPosts();
        setView('home');
    } catch (error) {
        console.error("Erro ao deletar post:", error);
        alert("Falha ao apagar a memória.");
    }
}

function setView(view, category = null, post = null) {
    currentView = view;
    selectedCategory = category;
    currentPost = post;
    renderApp();
}

function renderHeaderControls() {
    homeBtn.innerHTML = '<i data-feather="home" size="20"></i>';
    createBtn.innerHTML = '<i data-feather="plus" size="20"></i>';

    homeBtn.style.display = currentView !== 'home' ? 'flex' : 'none';
    createBtn.style.display = currentView !== 'create' ? 'flex' : 'none';

    homeBtn.onclick = () => setView('home');
    createBtn.onclick = () => setView('create');
    document.getElementById('logo').onclick = () => setView('home');

    feather.replace();
}

function renderHome() {
    let html = `
        <div class="fade-in">
            <div style="text-align: center; margin-top: 60px; margin-bottom: 20px;">
                <p style="font-family: var(--font-hand); font-size: 1.8rem; opacity: 0.8;">Bem-vindo.</p>
            </div>
            <div class="categories-grid">
                ${Object.entries(CATEGORIES).map(([key, cat]) => `
                    <div class="cat-card" data-category="${key}">
                        <i data-feather="${cat.icon}" class="cat-icon" size="24" stroke-width="1"></i>
                        <span class="cat-name">${cat.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    mainContent.innerHTML = html;
    feather.replace();

    mainContent.querySelectorAll('.cat-card').forEach(card => {
        card.onclick = () => setView('category', card.getAttribute('data-category'));
    });
}

function renderCategoryList() {
    const categoryInfo = CATEGORIES[selectedCategory];
    const filtered = posts.filter(p => p.categoria === selectedCategory);

    let listContent = '';

    if (selectedCategory === 'post-its') {
        listContent = `
            <div class="post-it-grid fade-in">
                ${filtered.map((post, idx) => `
                    <div 
                        data-post-id="${post.id}"
                        class="post-it-card rotate-${idx % 3}"
                        style="background-color: ${['#fff7d1', '#ffdee1', '#e2f7cb'][idx % 3]}"
                    >
                        <h3>${post.titulo}</h3>
                        <div style="overflow: hidden; flex-grow: 1;">${post.conteudo.substring(0, 100)}...</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        listContent = `
            <div class="standard-list fade-in">
                <h2 class="category-title">${categoryInfo.label}</h2>
                <p class="category-desc">${categoryInfo.desc}</p>
                <div class="list-separator"></div>
                ${filtered.length === 0 ? '<p class="empty-msg">Ainda não há nada aqui.</p>' : ''}
                ${filtered.map(post => `
                    <div data-post-id="${post.id}" class="post-row">
                        <span class="post-date">${new Date(post.dataCriacao).toLocaleDateString()}</span>
                        <span class="post-title">${post.titulo}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    mainContent.innerHTML = `
        <div>
            <div style="padding: 20px;">
                <button onclick="setView('home')" class="nav-btn"><i data-feather="chevron-left" size="20"></i> Voltar</button>
            </div>
            ${listContent}
        </div>
    `;
    feather.replace();

    mainContent.querySelectorAll('[data-post-id]').forEach(element => {
        element.onclick = () => {
            const postId = element.getAttribute('data-post-id');
            const post = posts.find(p => p.id == postId);
            setView('post', selectedCategory, post);
        };
    });
}

function renderSinglePost() {
    if (!currentPost) return;

    let containerClass = 'post-container';
    if (currentPost.categoria === 'senhor-ninguem') containerClass += ' theme-old-letter';
    if (currentPost.categoria === 'cartas') containerClass += ' theme-romantic';
    if (currentPost.categoria === 'post-its') containerClass += ' theme-sticky';
    if (currentPost.categoria === 'poesias') containerClass += ' theme-poetry';
    if (currentPost.categoria === 'composicoes') containerClass += ' theme-minimal';

    mainContent.innerHTML = `
        <div>
            <div style="padding: 20px; display: flex; justify-content: space-between;">
                <button onclick="setView('category', '${selectedCategory}')" class="nav-btn"><i data-feather="chevron-left" size="20"></i> Voltar</button>
            </div>
            <div class="single-post-wrapper fade-in ${containerClass}">
                <div class="post-content-area">
                    <div class="post-header">
                        <h1>${currentPost.titulo}</h1>
                        <span class="meta">${new Date(currentPost.dataCriacao).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div class="post-body">${currentPost.conteudo}</div>
                    
                    <div class="post-actions">
                        <button onclick="handleDelete('${currentPost.id}')" class="btn-icon"><i data-feather="trash-2" size="16"></i> Apagar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    feather.replace();
}

function renderCreate() {
    const editor = `
        <div class="editor-wrapper fade-in">
            <input id="editor-title" type="text" placeholder="Dê um nome ao sentimento..." class="input-title" />
            
            <select id="editor-category" class="category-select">
                ${Object.entries(CATEGORIES).map(([key, cat]) => `
                    <option value="${key}">${cat.label}</option>
                `).join('')}
            </select>

            <div class="toolbar">
                <button class="tool-btn" onclick="document.execCommand('bold')">Negrito</button>
                <button class="tool-btn" onclick="document.execCommand('italic')">Itálico</button>
                <button class="tool-btn" onclick="insertImage()">Imagem</button>
                <button class="tool-btn" onclick="insertVideo()">Vídeo</button>
            </div>

            <div 
                id="rich-editor"
                class="rich-editor" 
                contentEditable="true"
                data-placeholder="Escreva..."
                style="border-bottom: 1px solid #eee; margin-bottom: 20px;"
            ></div>

            <button id="save-post-btn" class="btn-primary">
                <i data-feather="save" size="16"></i> Guardar na memória
            </button>
        </div>
    `;
    mainContent.innerHTML = editor;
    feather.replace();

    const editorTitle = document.getElementById('editor-title');
    const editorCategory = document.getElementById('editor-category');
    const richEditor = document.getElementById('rich-editor');
    const saveBtn = document.getElementById('save-post-btn');

    editorCategory.onchange = () => {
        if (editorCategory.value === 'post-its') {
            editorTitle.setAttribute('disabled', 'true');
            editorTitle.placeholder = "Título automático para post-its";
            editorTitle.value = '';
        } else {
            editorTitle.removeAttribute('disabled');
            editorTitle.placeholder = "Dê um nome ao sentimento...";
        }
    };

    saveBtn.onclick = () => {
        const title = editorTitle.value;
        const content = richEditor.innerHTML;
        const category = editorCategory.value;
        handleSavePost(title, content, category);
    };

    window.insertImage = () => {
        const url = prompt('URL da Imagem:');
        if (url) document.execCommand('insertImage', false, url);
    };

    window.insertVideo = () => {
        const url = prompt('URL do YouTube:');
        if (url) {
            const embed = `<iframe width="100%" height="315" src="${url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>`;
            document.execCommand('insertHTML', false, embed);
        }
    };
}

function renderApp() {
    renderHeaderControls();

    switch (currentView) {
        case 'home':
            renderHome();
            break;
        case 'create':
            renderCreate();
            break;
        case 'category':
            renderCategoryList();
            break;
        case 'post':
            renderSinglePost();
            break;
        default:
            renderHome();
    }
}

async function init() {
    mainContent.innerHTML = `<div class="loading-screen"><h1 class="logo-text">Navy</h1><p>respirando...</p></div>`;

    await fetchPosts();

    renderApp();
}

init();
