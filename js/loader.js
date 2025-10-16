class PrescricaoLoader {
    constructor() {
        this.prescricoes = { todas: [] };
        this.carregadas = false;
        this.categorias = ['urgencia', 'consulta', 'cronico', 'sazonal', 'neonatal', 'geriatria'];
        
        // Mapeamento dos arquivos conhecidos (atualize conforme adicionar novos)
        this.arquivosConhecidos = {
            'urgencia': ['crise-respiratoria.json', 'asma-aguda.json'],
            'consulta': ['rinossinusite.json'],
            'cronico': [],
            'sazonal': [], 
            'neonatal': [],
            'geriatria': []
        };
    }

    async carregarTodasPrescricoes() {
        if (this.carregadas) return;
        
        console.log('🔄 Iniciando carregamento de prescrições...');
        
        try {
            // Carrega prescrições diretamente dos arquivos conhecidos
            for (const categoria of this.categorias) {
                console.log(`📂 Carregando categoria: ${categoria}`);
                const arquivos = this.arquivosConhecidos[categoria] || [];
                
                for (const arquivo of arquivos) {
                    await this.carregarPrescricaoIndividual(categoria, arquivo);
                }
                
                console.log(`✅ ${categoria}: ${arquivos.length} prescrições carregadas`);
            }
            
            this.carregadas = true;
            console.log(`🎉 Carregamento concluído! Total: ${this.prescricoes.todas.length} prescrições`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar prescrições:', error);
            throw error;
        }
    }

    async carregarPrescricaoIndividual(categoria, nomeArquivo) {
        try {
            const response = await fetch(`./js/prescricoes/${categoria}/${nomeArquivo}`);
            
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${response.status}`);
            }
            
            const prescricao = await response.json();
            
            // Validação básica
            if (!prescricao.id || !prescricao.nome || !prescricao.conteudo) {
                throw new Error(`Prescrição inválida: ${nomeArquivo}`);
            }
            
            // Adiciona metadados
            const prescricaoCompleta = {
                ...prescricao,
                categoriaArquivo: categoria,
                arquivoOrigem: `${categoria}/${nomeArquivo}`,
                carregadoEm: new Date().toISOString()
            };
            
            this.prescricoes.todas.push(prescricaoCompleta);
            
        } catch (error) {
            console.warn(`⚠️ Erro ao carregar ${categoria}/${nomeArquivo}:`, error.message);
            throw error;
        }
    }

    // Método para popular o select no HTML
    popularSelectPrescricoes() {
        const select = document.getElementById('prescription-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione uma prescrição...</option>';
        
        this.categorias.forEach(categoria => {
            const prescricoesCategoria = this.getPrescricoesPorCategoria(categoria);
            
            if (prescricoesCategoria.length > 0) {
                const group = document.createElement('optgroup');
                group.label = categoria.toUpperCase();
                
                prescricoesCategoria.forEach(prescricao => {
                    const option = document.createElement('option');
                    option.value = prescricao.id;
                    option.textContent = prescricao.nome;
                    option.setAttribute('data-categoria', categoria);
                    group.appendChild(option);
                });
                
                select.appendChild(group);
            }
        });
        
        // Adicionar evento de change
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                const prescricao = this.buscarPorId(e.target.value);
                if (prescricao && window.fillPrescriptionForm) {
                    window.fillPrescriptionForm(prescricao);
                }
            }
        });
    }

    getPrescricoes() {
        return this.prescricoes;
    }

    buscarPorId(id) {
        return this.prescricoes.todas.find(p => p.id === id);
    }

    getPrescricoesPorCategoria(categoria) {
        return this.prescricoes.todas.filter(p => p.categoriaArquivo === categoria);
    }

    getTotalPrescricoes() {
        return this.prescricoes.todas.length;
    }

    getEstatisticas() {
        const estatisticas = {
            total: this.prescricoes.todas.length,
            porCategoria: {},
            porFaixa: {},
            porTipo: {}
        };
        
        this.prescricoes.todas.forEach(presc => {
            // Por categoria
            estatisticas.porCategoria[presc.categoria] = 
                (estatisticas.porCategoria[presc.categoria] || 0) + 1;
            
            // Por faixa etária
            estatisticas.porFaixa[presc.faixa] = 
                (estatisticas.porFaixa[presc.faixa] || 0) + 1;
            
            // Por tipo
            estatisticas.porTipo[presc.tipo] = 
                (estatisticas.porTipo[presc.tipo] || 0) + 1;
        });
        
        return estatisticas;
    }
}

// Instância global e inicialização automática
const loader = new PrescricaoLoader();

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loader.carregarTodasPrescricoes();
        loader.popularSelectPrescricoes();
        console.log('✅ Sistema de prescrições inicializado!');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        const select = document.getElementById('prescription-select');
        if (select) {
            select.innerHTML = '<option>Erro ao carregar prescrições</option>';
        }
    }
});
