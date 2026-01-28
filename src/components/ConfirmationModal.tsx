import { X, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const variants = {
        danger: {
            icon: AlertCircle,
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            buttonText: 'text-white'
        },
        warning: {
            icon: AlertTriangle,
            iconColor: 'text-orange-600',
            iconBg: 'bg-orange-100',
            buttonBg: 'bg-orange-600 hover:bg-orange-700',
            buttonText: 'text-white'
        },
        info: {
            icon: AlertCircle,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
            buttonText: 'text-white'
        },
        success: {
            icon: CheckCircle,
            iconColor: 'text-green-600',
            iconBg: 'bg-green-100',
            buttonBg: 'bg-green-600 hover:bg-green-700',
            buttonText: 'text-white'
        }
    };

    const currentVariant = variants[variant];
    const Icon = currentVariant.icon;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all scale-100 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${currentVariant.iconBg}`}>
                            <Icon className={currentVariant.iconColor} size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 leading-6">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-black/5 ${currentVariant.buttonBg} ${currentVariant.buttonText}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
