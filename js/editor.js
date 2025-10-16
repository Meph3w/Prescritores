// Funções do editor de texto
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
        // Insere no final
        const p = document.createElement('p');
        p.textContent = texto;
        editor.appendChild(p);
    }
    
    editor.focus();
}

function limparEditor() {
    if (confirm('Tem certeza que deseja limpar o conteúdo da prescrição?')) {
        document.getElementById('editor').innerHTML = '';
    }
}

// Funções de busca em tempo real
function buscarPrescricoes() {
    if (!carregamentoConcluido) return;
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const searchResults = document.getElementById('searchResults');
    
    if (searchTerm.length < 2) {
        searchResults.style.display = 'none';
        filtrarPrescricoes(); // Atualiza filtro normal
        return;
    }
    
    const resultados = prescricoes.todas.filter(presc => 
        presc.nome.toLowerCase().includes(searchTerm) ||
        (presc.conteudo && presc.conteudo.toLowerCase().includes(searchTerm))
    );
    
    if (resultados.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">Nenhuma prescrição encontrada</div>';
    } else {
        searchResults.innerHTML = '';
        resultados.slice(0, 10).forEach(presc => { // Limita a 10 resultados
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <strong>${presc.nome}</strong>
                <br>
                <small>${formatarCategoria(presc.categoria)} • ${presc.faixa}</small>
            `;
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
    filtrarPrescricoes(); // Também atualiza o dropdown
}

// Fechar resultados da busca ao clicar fora
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
        document.getElementById('searchResults').style.display = 'none';
    }
});

// Tecla ESC fecha resultados
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('searchResults').style.display = 'none';
    }
});
