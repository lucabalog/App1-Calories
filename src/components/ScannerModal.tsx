import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Search,
  Sparkles,
  Zap,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { ProductNutrition } from '../types/nutrition';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { getNutriScoreDetails, getNovaDetails } from '../utils/nutritionCalculations';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: ProductNutrition) => void;
  targetMeal?: string;
}

type TabMode = 'camera' | 'upload' | 'demo' | 'search';

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onProductFound,
  targetMeal,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Manual search state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductNutrition[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Upload state
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadMimeType, setUploadMimeType] = useState<string>('image/jpeg');

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera when modal closes or changes tab
  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Initialize ZXing barcode reader when in camera tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCameraStream();
      return;
    }

    let isMounted = true;
    const reader = new BrowserMultiFormatReader();
    codeReaderRef.current = reader;

    const startScanner = async () => {
      try {
        setCameraError(null);
        setIsScanning(true);

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!isMounted) return;

        setVideoDevices(devices);

        // Prefer back camera if available
        let deviceIdToUse = selectedDeviceId;
        if (!deviceIdToUse && devices.length > 0) {
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          );
          deviceIdToUse = backCam ? backCam.deviceId : devices[0].deviceId;
          setSelectedDeviceId(deviceIdToUse);
        }

        if (videoRef.current) {
          await reader.decodeFromVideoDevice(
            deviceIdToUse || undefined,
            videoRef.current,
            (result, err) => {
              if (result && isMounted) {
                const detectedText = result.getText();
                handleLookupBarcode(detectedText);
              }
            }
          );
        }
      } catch (err: any) {
        console.warn('Camera initialization error:', err);
        if (isMounted) {
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera access was denied. Please allow camera permissions in your browser or use photo upload / demo barcodes.'
              : 'Could not start camera feed. You can upload a photo of the food packaging or choose a supermarket demo product below.'
          );
          setIsScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, [isOpen, activeTab, selectedDeviceId]);

  // Lookup barcode via server proxy
  const handleLookupBarcode = async (barcode: string) => {
    const clean = barcode.trim().replace(/\D/g, '');
    if (!clean) return;

    // Check if it matches our local sample products first for lightning speed
    const localMatch = SAMPLE_PRODUCTS.find((p) => p.barcode === clean);
    if (localMatch) {
      stopCameraStream();
      onProductFound(localMatch);
      onClose();
      return;
    }

    setIsLoading(true);
    setStatusMessage(`Looking up barcode ${clean} in supermarket database...`);

    try {
      const response = await fetch(`/api/product/${clean}`);
      const data = await response.json();

      if (response.ok && data.found && data.product) {
        stopCameraStream();
        onProductFound(data.product);
        onClose();
      } else {
        setStatusMessage(
          `Barcode ${clean} not found in database. You can analyze its nutrition label with AI Vision or select a supermarket item.`
        );
        setActiveTab('upload');
      }
    } catch (err: any) {
      console.error('Lookup error:', err);
      setStatusMessage('Network error fetching barcode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch camera toggle
  const toggleCamera = () => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      stopCameraStream();
      setSelectedDeviceId(videoDevices[nextIndex].deviceId);
    }
  };

  // Toggle torch / flash
  const toggleTorch = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities() as any;
      if (capabilities && capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchEnabled }] as any,
          });
          setTorchEnabled(!torchEnabled);
        } catch (e) {
          console.warn('Torch constraint error', e);
        }
      }
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type || 'image/jpeg';
    setUploadMimeType(mime);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini AI Vision analysis on uploaded image
  const handleAnalyzePhoto = async () => {
    if (!uploadedImagePreview) return;

    setIsLoading(true);
    setStatusMessage('Analyzing packaging, nutrition facts & ingredients with Gemini AI...');

    try {
      const response = await fetch('/api/analyze-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImagePreview,
          mimeType: uploadMimeType,
          barcodeHint: barcodeInput.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.product) {
        // Attach image preview to product for visual display
        const enrichedProduct: ProductNutrition = {
          ...data.product,
          imageUrl: uploadedImagePreview,
        };
        onProductFound(enrichedProduct);
        onClose();
      } else {
        setStatusMessage(data.error || 'Failed to read nutritional information from photo.');
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setStatusMessage('Failed to connect to AI vision analyzer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Product text search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      if (response.ok && data.products) {
        setSearchResults(data.products);
        if (data.products.length === 0) {
          setStatusMessage('No products matched that name. Try a broader search term like "oats", "milk", or "pasta".');
        }
      }
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>Scan Supermarket Food</span>
              {targetMeal && (
                <span className="text-xs font-normal text-slate-500 capitalize">
                  · Logging to {targetMeal}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan barcode, upload packaging label, or select test supermarket items
            </p>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Label Photo / AI</span>
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'demo'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Demo Products</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'search'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Search / EAN</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Status / Alert bar if any */}
          {statusMessage && (
            <div className="mb-4 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {isLoading && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-950">Processing Product Data</p>
                <p className="text-xs text-emerald-700">Connecting to nutrition databases and AI vision...</p>
              </div>
            </div>
          )}

          {/* TAB 1: LIVE CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />

                {/* Reticle / Target overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="w-64 h-36 border-2 border-dashed border-emerald-400 rounded-xl relative flex items-center justify-center bg-emerald-950/20 backdrop-brightness-110">
                    {/* Scanning laser bar */}
                    <div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                    <span className="text-[11px] font-medium text-emerald-200 bg-slate-900/80 px-2 py-0.5 rounded-md">
                      Align barcode inside frame
                    </span>
                  </div>
                </div>

                {/* Floating camera action controls */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  {videoDevices.length > 1 && (
                    <button
                      onClick={toggleCamera}
                      title="Switch Camera"
                      className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={toggleTorch}
                    title="Toggle Flashlight"
                    className={`p-2 rounded-xl backdrop-blur-md transition-colors ${
                      torchEnabled ? 'bg-amber-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {cameraError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">{cameraError}</p>
                    <p className="text-amber-700">
                      You can instantly test with preset supermarket foods in the <strong>Demo Products</strong> tab,
                      or upload an image of any food package in the <strong>Label Photo</strong> tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Barcode Number Input */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Or enter barcode numbers manually:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="e.g. 5201051000049"
                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    onClick={() => handleLookupBarcode(barcodeInput)}
                    disabled={!barcodeInput.trim() || isLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Lookup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTO UPLOAD & GEMINI VISION */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!uploadedImagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to upload a food product or nutrition label photo
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Take a snapshot of any supermarket packaging, barcode, or the back nutrition facts table.
                    Gemini AI will extract calories, macros, Nutri-Score, and NOVA score.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-64 flex items-center justify-center">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded food packaging"
                      className="max-h-64 w-auto object-contain"
                    />
                    <button
                      onClick={() => setUploadedImagePreview(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-slate-600 hover:text-slate-900 underline"
                    >
                      Choose different photo
                    </button>
                    <button
                      onClick={handleAnalyzePhoto}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isLoading ? 'Analyzing...' : 'Analyze with AI Vision'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800">Pro Tip for Best AI Results:</span>
                <p>
                  Ensure the nutrition facts table (calories, protein, fats, sugars) or ingredient list is well-lit and in focus.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DEMO PRESET PRODUCTS */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Click any real supermarket product below to instantly simulate scanning:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SAMPLE_PRODUCTS.map((prod) => {
                  const nutri = getNutriScoreDetails(prod.nutriscoreGrade);
                  const nova = getNovaDetails(prod.novaGroup);

                  return (
                    <button
                      key={prod.barcode}
                      onClick={() => {
                        stopCameraStream();
                        onProductFound(prod);
                        onClose();
                      }}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-start gap-3 cursor-pointer group bg-white shadow-xs"
                    >
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-slate-500 font-medium truncate">
                            {prod.brand || 'Supermarket'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${nutri.bgColor} ${nutri.textColor}`}
                          >
                            Score {prod.nutriscoreGrade || '?'}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 truncate mt-0.5">
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums mt-1">
                          <span>{prod.caloriesPer100g} kcal/100g</span>
                          <span>·</span>
                          <span className="text-[10px] text-slate-600 font-sans">
                            NOVA {prod.novaGroup || '?'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MANUAL SEARCH / EAN */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search product name (e.g. Greek yogurt, oats, pasta)..."
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {searchResults.map((prod) => (
                    <div
                      key={prod.barcode}
                      onClick={() => {
                        stopCameraStream();
                        onProductFound(prod);
                        onClose();
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="min-w-0">
                        <span className="text-xs text-slate-500">{prod.brand}</span>
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {prod.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                          {prod.caloriesPer100g} kcal/100g · Barcode: {prod.barcode}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
