
const confirmButtonClass = "px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-indigo-900 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50"
const redButtonClass = "px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-red-600 rounded-lg hover:bg-red-500 focus:outline-none focus:ring focus:ring-red-300 focus:ring-opacity-50"
const inlineButtonClass = "text-gray-400 underline"

interface ButtonProps {
    text: string,
    onClick: () => void,
}

const NormalButton: React.FC<ButtonProps> = ({ text, onClick }) => {
    return <button onClick={onClick} className={confirmButtonClass}>{text}</button>
}

const RedButton: React.FC<ButtonProps> = ({ text, onClick }) => {
    return <button onClick={onClick} className={redButtonClass}>{text}</button>
}

const InlineButton: React.FC<ButtonProps> = ({ text, onClick }) => {
    return <button onClick={onClick} className={inlineButtonClass}>{text}</button>
}

export { NormalButton, RedButton, InlineButton }