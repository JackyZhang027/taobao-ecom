@extends('ordering::layouts.master')

@section('content')
    <h1>Hello World</h1>

    <p>Module: {!! config('ordering.name') !!}</p>
@endsection
