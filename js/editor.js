// Funções do editor
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('editor').focus();
}

function inserirTexto(texto) {
    const editor = document.getElementById('editor');
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(texto);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        editor.innerHTML += `<p>${texto}</p>`;
    }
    
    editor.focus();
}

function limparEditor() {
    if (confirm('Tem certeza que deseja limpar o conteúdo?')) {
        document.getElementById('editor').innerHTML = '';
    }
}

// Funções de busca
function buscarPrescricoes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const searchResults = document.getElementById('searchResults');
    
    if (searchTerm.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    const resultados = prescricoes.todas.filter(presc => 
        presc.nome.toLowerCase().includes(searchTerm)
    );
    
    if (resultados.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">Nenhuma prescrição encontrada</div>';
    } else {
        searchResults.innerHTML = '';
        resultados.forEach(presc => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = presc.nome;
            item.onclick = function() {
                document.getElementById('searchInput').value = presc.nome;
                searchResults.style.display = 'none';
                
                // Selecionar no dropdown
                const select = document.getElementById('prescricao');
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].text === presc.nome) {
                        select.selectedIndex = i;
                        carregarConteudo();
                        break;
                    }
                }
            };
            searchResults.appendChild(item);
        });
    }
    
    searchResults.style.display = 'block';
}

// Fechar resultados da busca ao clicar fora
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
        document.getElementById('searchResults').style.display = 'none';
    }
});
