import { RadioGroup } from '@headlessui/react'
import Icon from '@/shared/components/ui/Icon.jsx'

const RE_MEDICINA_INTERNA = /medicina\s*interna/i

// Medicina Interna siempre primero; el resto en orden alfabético.
export function ordenarEspecialidades(especialidades = []) {
  const esMedicinaInterna = (esp) => RE_MEDICINA_INTERNA.test(esp?.nombre ?? '')
  const medicinaInterna = especialidades.filter(esMedicinaInterna)
  const resto = especialidades
    .filter((esp) => !esMedicinaInterna(esp))
    .sort((a, b) =>
      String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''), 'es', {
        sensitivity: 'base',
      }),
    )
  return [...medicinaInterna, ...resto]
}

// Selección de especialidad como rejilla de tiles grandes (tipo radio), para
// elegir de un solo toque en la pantalla POS. Franja ancha superior.
export default function SelectorEspecialidades({
  especialidades = [],
  value,
  onChange,
  disabled = false,
}) {
  const opciones = ordenarEspecialidades(especialidades)

  return (
    <section
      aria-label="Especialidad"
      className="rounded-xl bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-1 text-title-md font-bold text-on-surface">
          <Icon name="category" className="text-[20px] text-primary" />
          Especialidad
        </h2>
        <span className="text-label-sm text-on-surface-variant">
          Seleccione la especialidad antes de registrar
        </span>
      </div>

      {opciones.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">Cargando especialidades…</p>
      ) : (
        <RadioGroup
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
        >
          {opciones.map((especialidad) => (
            <RadioGroup.Option
              key={especialidad.id}
              value={String(especialidad.id)}
              className={({ checked, disabled: deshabilitado }) =>
                `flex min-h-[68px] select-none items-center justify-center rounded-xl px-4 py-3 text-center text-title-sm font-semibold leading-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  deshabilitado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${
                  checked
                    ? 'bg-primary text-on-primary shadow-md ring-2 ring-primary'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`
              }
            >
              {({ checked }) => (
                <span className="flex items-center gap-2">
                  {checked && <Icon name="check_circle" className="text-[22px]" />}
                  <span>{especialidad.nombre}</span>
                </span>
              )}
            </RadioGroup.Option>
          ))}
        </RadioGroup>
      )}
    </section>
  )
}
