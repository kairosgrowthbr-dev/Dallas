#!/usr/bin/perl
# Servidor local do Radar Dalas (painel de clientes) para Mac. Usa só o Perl que já vem em todo macOS:
# nada para instalar. Abre em http://localhost:8090 (ou a próxima porta livre)
# e fica rodando enquanto a janela do Terminal estiver aberta.
# Responde pedidos por partes (Range), que o Safari exige para tocar vídeos.
#
# Uso: perl servidor-mac.pl <pasta-do-site> [pagina-para-abrir]
use strict;
use warnings;
use utf8;
use IO::Socket::INET;
use IO::Socket::IP;
use Cwd qw(abs_path);

binmode STDOUT, ':encoding(UTF-8)';
$| = 1;

my $root = abs_path($ARGV[0] // '.');
my $page = $ARGV[1] // '';
unless ($root && -f "$root/index.html") {
  print "Não achei o index.html ao lado deste arquivo. Descompacte o zip inteiro antes de abrir.\n";
  exit 1;
}

my %TYPES = (
  html => 'text/html; charset=utf-8', js => 'text/javascript; charset=utf-8', mjs => 'text/javascript; charset=utf-8',
  css => 'text/css; charset=utf-8', json => 'application/json', webmanifest => 'application/manifest+json',
  svg => 'image/svg+xml', png => 'image/png', jpg => 'image/jpeg', jpeg => 'image/jpeg', webp => 'image/webp',
  gif => 'image/gif', ico => 'image/x-icon', avif => 'image/avif', mp4 => 'video/mp4', webm => 'video/webm',
  mp3 => 'audio/mpeg', woff => 'font/woff', woff2 => 'font/woff2', txt => 'text/plain; charset=utf-8', xml => 'application/xml',
);

# primeira porta livre de 8080 a 8099 (confere também o IPv6, que o Mac usa para "localhost")
my ($server, $port);
for my $p (8090 .. 8109) {
  my $busy = 0;
  for my $host ('127.0.0.1', '::1') {
    my $probe = IO::Socket::IP->new(PeerHost => $host, PeerPort => $p, Proto => 'tcp', Timeout => 1);
    if ($probe) { $busy = 1; close $probe; last; }
  }
  next if $busy;
  $server = IO::Socket::INET->new(LocalAddr => '127.0.0.1', LocalPort => $p, Proto => 'tcp', Listen => 64, ReuseAddr => 1);
  if ($server) { $port = $p; last; }
}
unless ($server) {
  print "Nenhuma porta livre entre 8090 e 8109. Feche outros servidores e tente de novo.\n";
  exit 1;
}
# o Safari e o Chrome tentam primeiro o IPv6 em "localhost": escuta lá também, se der
my $server6 = IO::Socket::IP->new(LocalHost => '::1', LocalPort => $port, Proto => 'tcp', Listen => 64, ReuseAddr => 1);

my $url = "http://localhost:$port/";
print "\n";
print "  Radar Dalas:  $url\n";
print "\n";
print "  Para parar, feche esta janela.\n\n";

# o aplicativo do Mac abre a janela sozinho e só precisa saber a porta
if ($ENV{RADAR_PORTA_ARQ} && open(my $pf, '>', $ENV{RADAR_PORTA_ARQ})) { print $pf $port; close $pf; }
if ($ENV{RADAR_SEM_ABRIR}) {
} elsif ($^O eq 'darwin') {
  system('open', "$url$page");
} else {
  system("xdg-open '$url$page' >/dev/null 2>&1 &");
}

$SIG{CHLD} = 'IGNORE';
$SIG{PIPE} = 'IGNORE';

# com o IPv6 também, um processo filho atende cada endereço
if ($server6) {
  my $pid = fork();
  if (defined $pid && $pid == 0) {
    close $server;
    serve($server6);
    exit 0;
  }
  close $server6 unless defined $pid && $pid > 0;
}
serve($server);

sub serve {
  my ($listen) = @_;
  while (1) {
    my $c = $listen->accept or next;
    my $pid = fork();
    if (!defined $pid) {
      handle($c);
      close $c;
      next;
    }
    if ($pid == 0) {
      close $listen;
      handle($c);
      close $c;
      exit 0;
    }
    close $c;
  }
}

sub plain {
  my ($c, $status, $extra) = @_;
  my $body = "$status\n";
  print $c "HTTP/1.1 $status\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: " . length($body)
    . "\r\nConnection: close\r\n" . ($extra // '') . "\r\n$body";
}

sub handle {
  my ($c) = @_;
  binmode $c;
  $c->autoflush(1);
  local $SIG{ALRM} = sub { exit 0 };
  alarm 20;
  my $line = <$c>;
  return unless defined $line;
  my %h;
  while (defined(my $l = <$c>)) {
    $l =~ s/\r?\n\z//;
    last if $l eq '';
    my ($k, $v) = split /:\s*/, $l, 2;
    $h{lc $k} = $v if defined $v;
  }
  alarm 0;
  my ($method, $target) = $line =~ m{^(GET|HEAD) (\S+)};
  unless ($method) {
    plain($c, '405 Method Not Allowed');
    return;
  }
  my $path = $target;
  $path =~ s/[?#].*\z//s;
  $path =~ s/%([0-9A-Fa-f]{2})/chr(hex $1)/ge;
  my @parts = grep { length && $_ ne '.' } split m{/}, $path;
  if (grep { $_ eq '..' || /\0/ } @parts) {
    plain($c, '403 Forbidden');
    return;
  }
  my $file = join '/', $root, @parts;
  if (-d $file) {
    if ($path !~ m{/\z}) {
      my ($p, $q) = $target =~ m{^([^?#]*)(.*)\z}s;
      plain($c, '301 Moved Permanently', "Location: $p/$q\r\n");
      return;
    }
    $file .= '/index.html';
  }
  unless (-f $file && -r _) {
    plain($c, '404 Not Found');
    return;
  }
  my $size = -s _;
  my ($ext) = $file =~ /\.([^.\/]+)\z/;
  my $type = $TYPES{ lc($ext // '') } // 'application/octet-stream';
  my ($start, $end, $status) = (0, $size - 1, '200 OK');
  if (($h{range} // '') =~ /^bytes=(\d*)-(\d*)\s*\z/ && $size > 0) {
    my ($a, $b) = ($1, $2);
    if ($a eq '' && $b ne '') {
      $start = $size - $b;
      $start = 0 if $start < 0;
    } else {
      $start = $a eq '' ? 0 : $a;
      $end = $b if $b ne '' && $b < $end;
    }
    if ($start > $end || $start >= $size) {
      plain($c, '416 Range Not Satisfiable', "Content-Range: bytes */$size\r\n");
      return;
    }
    $status = '206 Partial Content';
  }
  my $len = $size ? $end - $start + 1 : 0;
  my $hdr = "HTTP/1.1 $status\r\nContent-Type: $type\r\nContent-Length: $len\r\nAccept-Ranges: bytes\r\n"
    . "Cache-Control: no-cache\r\nConnection: close\r\n";
  $hdr .= "Content-Range: bytes $start-$end/$size\r\n" if $status =~ /^206/;
  print $c "$hdr\r\n" or return;
  return if $method eq 'HEAD' || !$len;
  open my $fh, '<:raw', $file or return;
  seek $fh, $start, 0;
  my $left = $len;
  my $buf;
  alarm 600;
  while ($left > 0) {
    my $n = read $fh, $buf, ($left > 65536 ? 65536 : $left);
    last unless $n;
    print $c $buf or last;
    $left -= $n;
  }
  alarm 0;
  close $fh;
}
