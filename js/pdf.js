// Funções para PDF e impressão
async function salvarComoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const nomePaciente = document.getElementById('nomePaciente').value || '_________________________';
    const dataPrescricao = document.getElementById('dataPrescricao').value;
    
    const dataFormatada = dataPrescricao ? 
        new Date(dataPrescricao).toLocaleDateString('pt-BR') : 
        new Date().toLocaleDateString('pt-BR');
    
    try {
        // Converter HTML para imagem usando html2canvas
        const element = document.getElementById('editor');
        const canvas = await html2canvas(element, {
            scale: 2, // Melhor qualidade
            useCORS: true,
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Configurações do PDF
        doc.setFontSize(16);
        doc.setTextColor(99, 105, 209);
        doc.text('PRESCRIÇÃO MÉDICA', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Paciente: ${nomePaciente}`, 20, 40);
        doc.text(`Data: ${dataFormatada}`, 20, 60);
        
        // Adicionar imagem do conteúdo
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 40;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'PNG', 20, 80, pdfWidth, pdfHeight);
        
        // Assinatura (em nova página se necessário)
        let finalY = 80 + pdfHeight + 20;
        
        // Verifica se precisa de nova página
        if (finalY > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            finalY = 40;
        }
        
        doc.text('_________________________', 105, finalY, { align: 'center' });
        doc.text('Assinatura do Profissional', 105, finalY + 10, { align: 'center' });
        
        // Nome do arquivo
        const nomeArquivo = nomePaciente !== '_________________________' ? 
            `prescricao-${nomePaciente.replace(/\s+/g, '_')}.pdf` : 
            'prescricao-medica.pdf';
            
        doc.save(nomeArquivo);
        
        console.log('✅ PDF salvo com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
    }
}

function imprimirPrescricao() {
    const nomePaciente = document.getElementById('nomePaciente').value || '_________________________';
    const dataPrescricao = document.getElementById('dataPrescricao').value;
    const conteudoEditor = document.getElementById('editor').innerHTML;
    
    const dataFormatada = dataPrescricao ? 
        new Date(dataPrescricao).toLocaleDateString('pt-BR') : 
        new Date().toLocaleDateString('pt-BR');
    
    const conteudoImpressao = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Prescrição Médica - ${nomePaciente}</title>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px; 
                    line-height: 1.6;
                    color: #2c3e50;
                    font-size: 14px;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    border-bottom: 2px solid #6369D1;
                    padding-bottom: 20px;
                }
                .paciente-info {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .medicamento {
                    margin: 15px 0;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    border-left: 4px solid #6369D1;
                }
                .dosagem {
                    font-weight: bold;
                    color: #2c3e50;
                }
                .assinatura { 
                    text-align: center; 
                    margin-top: 80px; 
                }
                .linha-assinatura { 
                    border-top: 1px solid #000; 
                    width: 300px; 
                    margin: 40px auto 10px; 
                    padding-top: 15px;
                }
                .alerta {
                    background: #fff3cd;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                    border-left: 4px solid #ffc107;
                }
                .emergencia {
                    background: #f8d7da;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                    border-left: 4px solid #dc3545;
                }
                .info {
                    background: #d1ecf1;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                    border-left: 4px solid #0dcaf0;
                }
                @media print {
                    body { margin: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PRESCRIÇÃO MÉDICA</h1>
            </div>
            
            <div class="paciente-info">
                <p><strong>Paciente:</strong> ${nomePaciente}</p>
                <p><strong>Data:</strong> ${dataFormatada}</p>
            </div>
            
            <div class="conteudo">
                ${conteudoEditor}
            </div>
            
            <div class="assinatura">
                <div class="linha-assinatura"></div>
                <p><strong>_________________________</strong></p>
            </div>
            
            <div class="no-print" style="margin-top: 50px; text-align: center; color: #6c757d;">
                <p>Sistema de Prescrições Médicas - AnamnesIA</p>
            </div>
        </body>
        </html>
    `;
    
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoImpressao);
    janelaImpressao.document.close();
    
    // Espera o conteúdo carregar antes de imprimir
    janelaImpressao.onload = function() {
        janelaImpressao.focus();
        janelaImpressao.print();
    };
}
