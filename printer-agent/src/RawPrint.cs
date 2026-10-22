using System;
using System.IO;
using System.Runtime.InteropServices;

// Envía bytes RAW (ESC/POS) al spooler de Windows usando el driver ya instalado.
// No requiere compartir la impresora en red.
internal static class RawPrint
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private class DocInfo
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool OpenPrinter(string src, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
    private static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DocInfo di);

    [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
    private static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
    private static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
    private static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
    private static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    private static int Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.Error.WriteLine("uso: RawPrint.exe <nombre-impresora> <archivo-bin>");
            return 2;
        }

        byte[] bytes;
        try
        {
            bytes = File.ReadAllBytes(args[1]);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("No se pudo leer el archivo: " + ex.Message);
            return 3;
        }

        IntPtr hPrinter;
        if (!OpenPrinter(args[0], out hPrinter, IntPtr.Zero))
        {
            Console.Error.WriteLine("No se pudo abrir la impresora '" + args[0] + "'. Código Win32: " + Marshal.GetLastWin32Error());
            return 4;
        }

        bool ok = false;
        try
        {
            var di = new DocInfo { pDocName = "HRO Ticket", pDataType = "RAW" };
            if (!StartDocPrinter(hPrinter, 1, di))
            {
                Console.Error.WriteLine("StartDocPrinter falló. Código Win32: " + Marshal.GetLastWin32Error());
                return 5;
            }

            StartPagePrinter(hPrinter);
            IntPtr memoria = Marshal.AllocCoTaskMem(bytes.Length);
            try
            {
                Marshal.Copy(bytes, 0, memoria, bytes.Length);
                int escrito;
                ok = WritePrinter(hPrinter, memoria, bytes.Length, out escrito);
                if (!ok)
                {
                    Console.Error.WriteLine("WritePrinter falló. Código Win32: " + Marshal.GetLastWin32Error());
                }
            }
            finally
            {
                Marshal.FreeCoTaskMem(memoria);
                EndPagePrinter(hPrinter);
                EndDocPrinter(hPrinter);
            }
        }
        finally
        {
            ClosePrinter(hPrinter);
        }

        return ok ? 0 : 6;
    }
}
