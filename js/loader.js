class PrescricaoLoader {
    constructor() {
        this.prescricoes = { todas: [] };
        this.carregadas = false;
        this.categoriasUnicas = new Set();
        this.faixasUnicas = new Set();
        this.tiposUnicos = new Set();
        this.indice = null;
    }

    async carregarTodasPrescricoes() {
        if (this.carregadas) return;
        
        console.log('🔄 Carregando prescrições dinamicamente...');
        
        try {
            // 1. Carrega o índice que mapeia todos os arquivos
            await this.carregarIndice();
            
            // 2. Carrega cada prescrição do índice
            for (const item of this.indice.arquivos) {
                await this.carregarPrescricaoDoIndice(item);
            }
            
            // 3. Extrai categorias, faixas e tipos DOS DADOS reais
            this.extrairMetadadosDinamicamente();
            
            this.carregadas = true;
            console.log('🎉 Sistema carregado!', this.getEstatisticas());
            
        } catch (error) {
            console.error('❌ Erro no carregamento:', error);
            throw error;
        }
    }

    async carregarIndice() {
        try {
            const response = await fetch('./js/prescricoes/indice.json');
            if (!response.ok) throw new Error('Índice não encontrado');
            
            this.indice = await response.json();
            console.log(`📋 Índice carregado: ${this.indice.totalArquivos} arquivos`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar índice:', error);
            throw new Error('Execute primeiro o gerador de índice');
        }
    }

    async carregarPrescricaoDoIndice(itemIndice) {
        try {
            const response = await fetch(`./js/prescricoes/${itemIndice.caminho}`);
            
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${itemIndice.caminho}`);
            }
            
            const prescricao = await response.json();
            
            // Adiciona metadados
            const [categoriaArquivo] = itemIndice.caminho.split('/');
            const prescricaoCompleta = {
                ...prescricao,
                categoriaArquivo: categoriaArquivo,
                arquivoOrigem: itemIndice.caminho,
                carregadoEm: new Date().toISOString()
            };
            
            this.prescricoes.todas.push(prescricaoCompleta);
            
        } catch (error) {
            console.warn(`⚠️ Erro ao carregar ${itemIndice.caminho}:`, error.message);
        }
    }

    extrairMetadadosDinamicamente() {
        // Extrai categorias, faixas e tipos DOS DADOS REAIS carregados
        this.prescricoes.todas.forEach(prescricao => {
            if (prescricao.categoria) this.categoriasUnicas.add(prescricao.categoria);
            if (prescricao.faixa) this.faixasUnicas.add(prescricao.faixa);
            if (prescricao.tipo) this.tiposUnicos.add(prescricao.tipo);
        });
        
        console.log('📊 Metadados extraídos:', {
            categorias: [...this.categoriasUnicas],
            faixas: [...this.faixasUnicas], 
            tipos: [...this.tiposUnicos]
        });
    }

    // Métodos para interface
    popularFiltros() {
        this.popularSelect('filter-category', [...this.categoriasUnicas]);
        this.popularSelect('filter-age', [...this.faixasUnicas]);
        this.popularSelect('filter-type', [...this.tiposUnicos]);
    }

    popularSelect(id, opcoes) {
        const select = document.getElementById(id);
        if (!select) return;
        
        select.innerHTML = '<option value="">Todas</option>';
        opcoes.forEach(opcao => {
            const option = document.createElement('option');
            option.value = opcao;
            option.textContent = opcao;
            select.appendChild(option);
        });
    }

    filtrarPrescricoes(filtros = {}) {
        return this.prescricoes.todas.filter(prescricao => {
            return (
                (!filtros.categoria || prescricao.categoria === filtros.categoria) &&
                (!filtros.faixa || prescricao.faixa === filtros.faixa) &&
                (!filtros.tipo || prescricao.tipo === filtros.tipo)
            );
        });
    }

    getPrescricoes() {
        return this.prescricoes;
    }

    buscarPorId(id) {
        return this.prescricoes.todas.find(p => p.id === id);
    }

    getPrescricoesPorCategoria(categoria) {
        return this.prescricoes.todas.filter(p => p.categoria === categoria);
    }

    getEstatisticas() {
        return {
            total: this.prescricoes.todas.length,
            categorias: this.categoriasUnicas.size,
            faixas: this.faixasUnicas.size,
            tipos: this.tiposUnicos.size
        };
    }
}

// Instância global
const loader = new PrescricaoLoader();
