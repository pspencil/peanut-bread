
export interface InputWithLabelProps {
    value: string;
    setValue: (a: string) => void;
    id: string;
    placeholder: string;
}

export function InputWithLabel({ value, setValue, id, placeholder }: InputWithLabelProps) {
    return (
        <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor={id}>{id}</label>
            <input
                id={id}
                type="text"
                placeholder={placeholder}
                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                value={value}
                onChange={(e) => setValue(e.target.value)} />
        </div>
    );
}
