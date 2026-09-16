import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'

function ChevronDown() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccione...',
  className = '',
}) {
  const seleccionada = options.find((opcion) => opcion.value === value) ?? null

  return (
    <div className={`space-y-1 ${className}`}>
      {label && <span className="block text-sm font-medium text-slate-700">{label}</span>}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-left text-sm focus:border-hro-blue focus:outline-none focus:ring-2 focus:ring-cyan-100">
            <span className={seleccionada ? 'text-slate-800' : 'text-slate-400'}>
              {seleccionada ? seleccionada.label : placeholder}
            </span>
            <span className="absolute inset-y-0 right-2 flex items-center">
              <ChevronDown />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
              {options.map((opcion) => (
                <Listbox.Option
                  key={opcion.value}
                  value={opcion.value}
                  className="cursor-pointer select-none px-3 py-2 text-slate-700 data-[focus]:bg-cyan-50 data-[selected]:font-semibold"
                >
                  {opcion.label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}
