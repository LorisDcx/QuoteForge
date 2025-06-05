"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, AlertCircle, FileUp } from "lucide-react";
import { extractFromPDF, ExtractionResult } from '@/lib/pdf-parser';
import { QuoteItem } from '@/types/quote';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PdfImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: ExtractionResult) => void;
}

export function PdfImportDialog({ isOpen, onClose, onImport }: PdfImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'cctp' | 'dpgf' | 'auto'>('auto');
  const [includeDescriptions, setIncludeDescriptions] = useState(true);
  const [detectPrices, setDetectPrices] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };
  
  // Gestion du glisser-déposer
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Veuillez déposer un fichier PDF");
      }
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier PDF");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await extractFromPDF(file, {
        type: documentType,
        includeDescriptions,
        detectPrices
      });
      
      if (result.success) {
        onImport(result);
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'importation");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] relative overflow-visible">
        <DialogHeader>
          <DialogTitle className="text-midnight-blue">Importer un CCTP ou DPGF</DialogTitle>
          <DialogDescription>
            Importez un document PDF pour extraire automatiquement les éléments du devis.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Sélection du fichier */}
          <div className="space-y-2">
            <Label htmlFor="pdf-file" className="text-lg font-medium">Sélectionner un fichier PDF</Label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => document.getElementById('pdf-file')?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                id="pdf-file"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center justify-center gap-2 text-midnight-blue">
                  <FileText className="w-12 h-12 text-forge-orange" />
                  <span className="font-medium text-lg">{file.name}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Changer de fichier
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Upload className="w-16 h-16 mb-4 text-forge-orange" />
                  <span className="font-medium text-lg mb-2">Cliquez pour sélectionner un fichier PDF</span>
                  <span className="text-sm mb-4">ou glissez-déposez un fichier ici</span>
                  <div className="p-2 bg-gray-100 rounded-md text-xs text-gray-600 w-full max-w-xs">
                    Formats supportés : PDF (CCTP, DPGF, devis existants)
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Type de document */}
          <div className="space-y-2">
            <Label>Type de document</Label>
            <RadioGroup 
              value={documentType} 
              onValueChange={(value: string) => setDocumentType(value as 'cctp' | 'dpgf' | 'auto')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="cursor-pointer">Auto-détection</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cctp" id="cctp" />
                <Label htmlFor="cctp" className="cursor-pointer">CCTP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dpgf" id="dpgf" />
                <Label htmlFor="dpgf" className="cursor-pointer">DPGF</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Options */}
          <div className="space-y-2">
            <Label>Options d'extraction</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-descriptions" 
                  checked={includeDescriptions}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setIncludeDescriptions(checked === true)}
                />
                <Label htmlFor="include-descriptions" className="cursor-pointer">
                  Extraire les descriptions détaillées
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="detect-prices" 
                  checked={detectPrices}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setDetectPrices(checked === true)}
                />
                <Label htmlFor="detect-prices" className="cursor-pointer">
                  Détecter les prix et quantités
                </Label>
              </div>
            </div>
          </div>
          
          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between gap-4 mt-8">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1 py-3">
            Annuler
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isLoading}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold text-lg px-8 py-3 flex-1 shadow-md"
            style={{ zIndex: 9999 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <FileUp className="mr-3 h-5 w-5" />
                Importer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
