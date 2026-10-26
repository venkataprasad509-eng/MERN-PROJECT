import { AlertCircle, BookOpen } from 'lucide-react';

export const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
    <h3 className="text-xl font-semibold text-gray-700 mb-2">Oops!</h3>
    <p className="text-gray-500 mb-6 max-w-sm">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary">Try Again</button>
    )}
  </div>
);

export const EmptyState = ({ title = 'Nothing here yet', description = '', action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <BookOpen className="w-16 h-16 text-indigo-300 mb-4" />
    <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
    {description && <p className="text-gray-500 mb-6 max-w-sm">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

export default ErrorState;
