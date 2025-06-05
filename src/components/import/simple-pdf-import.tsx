"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { FileUp, FileText, Upload, Loader2, AlertCircle, Sparkles, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { extractFromPDF, ExtractionResult } from '@/lib/pdf-parser';

interface SimplePdfImportProps {
  onImport: (result: ExtractionResult) => void;
}

export function SimplePdfImport({ onImport }: SimplePdfImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  const [extractionSuccess, setExtractionSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };
  
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
    setExtractionSuccess(false);
    
    try {
      const result = await extractFromPDF(file, {
        type: 'auto',
        includeDescriptions: true,
        detectPrices: true,
        useAI: useAI
      });
      
      if (result.success) {
        onImport(result);
        setExtractionSuccess(true);
        // Ne pas réinitialiser le fichier pour permettre à l'utilisateur de voir ce qui a été importé
        // setFile(null);
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
    <div className="space-y-4">
      <div 
        className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {file ? (
          <div className="flex flex-col items-center justify-center gap-2 text-midnight-blue">
            <FileText className="w-12 h-12 text-[#FF6B35]" />
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
            <Upload className="w-16 h-16 mb-4 text-[#FF6B35]" />
            <span className="font-medium text-lg mb-2">Cliquez pour sélectionner un fichier PDF</span>
            <span className="text-sm mb-4">ou glissez-déposez un fichier ici</span>
            <div className="p-2 bg-gray-100 rounded-md text-xs text-gray-600 w-full max-w-xs">
              Formats supportés : PDF (CCTP, DPGF, devis existants)
            </div>
          </div>
        )}
      </div>
      
      {extractionSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start gap-2 mb-4">
          <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>Extraction réussie ! Les éléments ont été ajoutés à votre devis.</p>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-2 mb-4">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="use-ai"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
          />
          <Label htmlFor="use-ai" className="flex items-center cursor-pointer">
            <Sparkles className="h-4 w-4 mr-2 text-[#FF6B35]" />
            <span className="font-medium">Utiliser l'IA pour analyser le document</span>
          </Label>
        </div>
        <div className="text-xs text-gray-500 ml-6 mt-1">
          L'IA analysera intelligemment le contenu du PDF pour extraire les éléments du devis
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleImport} 
          disabled={!file || isLoading}
          className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold px-6 py-2 shadow-sm"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {useAI ? "Analyse IA en cours..." : "Traitement..."}
            </>
          ) : (
            <>
              {useAI ? (
                <Sparkles className="mr-2 h-5 w-5" />
              ) : (
                <FileUp className="mr-2 h-5 w-5" />
              )}
              Importer le CCTP/DPGF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
